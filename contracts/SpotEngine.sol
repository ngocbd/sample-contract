// SPDX-License-Identifier: GPL-2.0-or-later
pragma solidity ^0.8.0;

import "./common/Constants.sol";
import "./common/Errors.sol";
import "./interfaces/IOffchainBook.sol";
import "./interfaces/engine/ISpotEngine.sol";
import "./interfaces/clearinghouse/IClearinghouse.sol";
import "./libraries/MathHelper.sol";
import "./libraries/MathSD21x18.sol";
import "./interfaces/IERC20Base.sol";
import "./BaseEngine.sol";
import "./SpotEngineState.sol";
import "./SpotEngineLP.sol";
import "./Version.sol";

contract SpotEngine is SpotEngineLP, Version {
    using MathSD21x18 for int128;

    function initialize(
        address _clearinghouse,
        address _quote,
        address _endpoint,
        address _admin,
        address _fees
    ) external {
        _initialize(_clearinghouse, _quote, _endpoint, _admin, _fees);

        configs[QUOTE_PRODUCT_ID] = Config({
            token: _quote,
            interestInflectionUtilX18: 8e17, // .8
            interestFloorX18: 1e16, // .01
            interestSmallCapX18: 4e16, // .04
            interestLargeCapX18: ONE // 1
        });
        states[QUOTE_PRODUCT_ID] = State({
            cumulativeDepositsMultiplierX18: ONE,
            cumulativeBorrowsMultiplierX18: ONE,
            totalDepositsNormalized: 0,
            totalBorrowsNormalized: 0
        });
        productIds.push(QUOTE_PRODUCT_ID);
        emit AddProduct(QUOTE_PRODUCT_ID);
    }

    /**
     * View
     */

    function getEngineType() external pure returns (EngineType) {
        return EngineType.SPOT;
    }

    function getConfig(uint32 productId) external view returns (Config memory) {
        return configs[productId];
    }

    function getWithdrawFee(uint32 productId) external view returns (int128) {
        if (productId == QUOTE_PRODUCT_ID) {
            return 1e18;
        } else {
            return withdrawFees[productId];
        }
    }

    /**
     * Actions
     */

    /// @notice adds a new product with default parameters
    function addProduct(
        uint32 healthGroup,
        address book,
        int128 sizeIncrement,
        int128 priceIncrementX18,
        int128 minSize,
        int128 lpSpreadX18,
        Config calldata config,
        IClearinghouseState.RiskStore calldata riskStore
    ) public onlyOwner {
        uint32 productId = _addProductForId(
            healthGroup,
            riskStore,
            book,
            sizeIncrement,
            priceIncrementX18,
            minSize,
            lpSpreadX18
        );

        configs[productId] = config;
        states[productId] = State({
            cumulativeDepositsMultiplierX18: ONE,
            cumulativeBorrowsMultiplierX18: ONE,
            totalDepositsNormalized: 0,
            totalBorrowsNormalized: 0
        });

        lpStates[productId] = LpState({
            supply: 0,
            quote: Balance({amount: 0, lastCumulativeMultiplierX18: ONE}),
            base: Balance({amount: 0, lastCumulativeMultiplierX18: ONE})
        });
    }

    function updateProduct(bytes calldata tx) external onlyEndpoint {
        UpdateProductTx memory tx = abi.decode(tx, (UpdateProductTx));
        IClearinghouseState.RiskStore memory riskStore = tx.riskStore;

        if (tx.productId != QUOTE_PRODUCT_ID) {
            require(
                riskStore.longWeightInitial <=
                    riskStore.longWeightMaintenance &&
                    riskStore.shortWeightInitial >=
                    riskStore.shortWeightMaintenance &&
                    // we messed up placeholder's token address so we have to find
                    // a new way to check whether a product is a placeholder.
                    (states[tx.productId].totalDepositsNormalized == 0 ||
                        configs[tx.productId].token == tx.config.token),
                ERR_BAD_PRODUCT_CONFIG
            );
            markets[tx.productId].modifyConfig(
                tx.sizeIncrement,
                tx.priceIncrementX18,
                tx.minSize,
                tx.lpSpreadX18
            );
        }

        configs[tx.productId] = tx.config;
        _clearinghouse.modifyProductConfig(tx.productId, riskStore);
    }

    /// @notice updates internal balances; given tuples of (product, subaccount, delta)
    /// since tuples aren't a thing in solidity, params specify the transpose
    function applyDeltas(ProductDelta[] calldata deltas) external {
        checkCanApplyDeltas();

        // May load the same product multiple times
        for (uint32 i = 0; i < deltas.length; i++) {
            if (deltas[i].amountDelta == 0) {
                continue;
            }

            uint32 productId = deltas[i].productId;
            bytes32 subaccount = deltas[i].subaccount;
            int128 amountDelta = deltas[i].amountDelta;
            State memory state = states[productId];
            BalanceNormalized memory balance = balances[productId][subaccount]
                .balance;

            _updateBalanceNormalized(state, balance, amountDelta);

            states[productId].totalDepositsNormalized = state
                .totalDepositsNormalized;
            states[productId].totalBorrowsNormalized = state
                .totalBorrowsNormalized;

            balances[productId][subaccount].balance = balance;

            _balanceUpdate(productId, subaccount);
        }
    }

    // only check on withdraw -- ensure that users can't withdraw
    // funds that are in the Vertex contract but not officially
    // 'deposited' into the Vertex system and counted in balances
    // (i.e. if a user transfers tokens to the clearinghouse
    // without going through the standard deposit)
    function assertUtilization(uint32 productId) external view {
        State memory _state = states[productId];
        require(
            _state.totalDepositsNormalized.mul(
                _state.cumulativeDepositsMultiplierX18
            ) >=
                _state.totalBorrowsNormalized.mul(
                    _state.cumulativeBorrowsMultiplierX18
                ),
            ERR_MAX_UTILIZATION
        );
    }

    function socializeSubaccount(bytes32 subaccount) external {
        require(msg.sender == address(_clearinghouse), ERR_UNAUTHORIZED);

        for (uint128 i = 0; i < productIds.length; ++i) {
            uint32 productId = productIds[i];
            (State memory state, Balance memory balance) = getStateAndBalance(
                productId,
                subaccount
            );
            if (balance.amount < 0) {
                int128 totalDeposited = state.totalDepositsNormalized.mul(
                    state.cumulativeDepositsMultiplierX18
                );

                state.cumulativeDepositsMultiplierX18 = (totalDeposited +
                    balance.amount).div(state.totalDepositsNormalized);

                state.totalBorrowsNormalized += balance.amount.div(
                    state.cumulativeBorrowsMultiplierX18
                );

                balances[productId][subaccount].balance.amountNormalized = 0;

                if (productId == QUOTE_PRODUCT_ID) {
                    for (uint128 j = 0; j < productIds.length; ++j) {
                        uint32 baseProductId = productIds[j];
                        if (baseProductId == QUOTE_PRODUCT_ID) {
                            continue;
                        }
                        LpState memory lpState = lpStates[baseProductId];
                        _updateBalanceWithoutDelta(state, lpState.quote);
                        lpStates[baseProductId] = lpState;
                        _productUpdate(baseProductId);
                    }
                } else {
                    LpState memory lpState = lpStates[productId];
                    _updateBalanceWithoutDelta(state, lpState.base);
                    lpStates[productId] = lpState;
                }

                states[productId] = state;
                _balanceUpdate(productId, subaccount);
            }
        }
    }

    function manualAssert(
        int128[] calldata totalDeposits,
        int128[] calldata totalBorrows
    ) external view {
        for (uint128 i = 0; i < totalDeposits.length; ++i) {
            uint32 productId = productIds[i];
            State memory state = states[productId];
            require(
                state.totalDepositsNormalized.mul(
                    state.cumulativeDepositsMultiplierX18
                ) == totalDeposits[i],
                ERR_DSYNC
            );
            require(
                state.totalBorrowsNormalized.mul(
                    state.cumulativeBorrowsMultiplierX18
                ) == totalBorrows[i],
                ERR_DSYNC
            );
        }
    }

    function isPlaceholder(uint32 productId) external view returns (bool) {
        return states[productId].totalDepositsNormalized == 0;
    }

    function getToken(uint32 productId) external view returns (address) {
        return address(configs[productId].token);
    }
}
