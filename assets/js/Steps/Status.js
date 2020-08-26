/**
 * @file
 *
 * @TODO: Describe what it is used for.
 */

import React, { useContext, useEffect } from 'react';
import BannerList from './components/bannerList';
import Header from './components/header';
import MachineStateContext from '../context/machineStateContext';
import {
    BARCODE_COMMAND_FINISH,
    BARCODE_COMMAND_LENGTH,
    BARCODE_SCANNING_TIMEOUT,
    BARCODE_COMMAND_CHECKOUT,
    BARCODE_COMMAND_CHECKIN
} from '../constants';
import BarcodeScanner from './BarcodeScanner';
import PropTypes from 'prop-types';

/**
 * Status.
 *
 * @param actionHandler
 *   @TODO: Describe prop.
 * @return {*}
 * @constructor
 */
function Status({ actionHandler }) {
    const context = useContext(MachineStateContext);

    /**
     * Set up barcode listener.
     */
    useEffect(() => {
        const barcodeScanner = new BarcodeScanner(BARCODE_SCANNING_TIMEOUT);
        const barcodeCallback = (code) => {
            if (code.length === BARCODE_COMMAND_LENGTH) {
                if (code === BARCODE_COMMAND_FINISH) {
                    actionHandler('changeFlow', { flow: 'reset' });
                }

                if (code === BARCODE_COMMAND_CHECKOUT) {
                    actionHandler('changeFlow', {
                        flow: 'checkOutItems'
                    });
                }

                if (code === BARCODE_COMMAND_CHECKIN) {
                    actionHandler('changeFlow', {
                        flow: 'checkInItems'
                    });
                }
            }
        };

        barcodeScanner.start(barcodeCallback);
        return () => {
            barcodeScanner.stop();
        };
    }, [actionHandler]);

    return (
        <div className="col-md">
            <div className="col-md-9" style={{ paddingLeft: '0' }}>
                <Header
                    header="Status"
                    text="Dine aktuelle lån og reserveringer"
                />
            </div>
            <div className="row">
                <div className="col-md-4 mt-4">
                    <BannerList
                        title={'Aktuelle lån'}
                        items={[
                            ...context.machineState.get.fineItems,
                            ...context.machineState.get.overdueItems,
                            ...context.machineState.get.recallItems,
                            ...context.machineState.get.chargedItems
                        ]}
                    />
                </div>
                <div className="col-md-4 mt-4">
                    <BannerList
                        title={'Reservationer'}
                        items={context.machineState.get.unavailableHoldItems}
                    />
                </div>
                <div className="col-md-4 mt-4">
                    <BannerList
                        title={'Klar til afhentning'}
                        items={context.machineState.get.holdItems}
                    />
                </div>
            </div>
        </div>
    );
}

Status.propTypes = {
    actionHandler: PropTypes.func.isRequired
};

export default Status;