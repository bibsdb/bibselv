import React, { useState } from 'react';
import socketIOClient from 'socket.io-client';
import Initial from './steps/Initial';
import Login from './steps/login';
import Status from './steps/status';
import Handin from './steps/handin';
import { fakeHandleAction } from './actionFaker';
import Borrow from './steps/borrow';
import NavBar from './steps/components/navbar';
import MachineStateContext from './context/machineStateContext';
import bookStatus from './steps/components/bookStatus';
import DebugBar from './steps/components/debugBar';

function App() {
    function handleAction(action, data) {
        if (false) {
            this.socket.emit('ClientEvent', {
                name: 'Action',
                token: this.state.token,
                action: action,
                data: data
            });
        } else {
            fakeHandleAction(action, data);
        }
    }

    function renderStep(step, machineState) {
        if (step === 'initial') {
            return <Initial actionHandler={handleAction} />;
        }
        if (loggedIn) {
            switch (step) {
            case 'borrow':
                return <Borrow />;
            case 'handin':
                return <Handin />;
            case 'status':
                return <Status />;
            default:
                return <Initial actionHandler={handleAction} />;
            }
        } else {
            return <Login actionHandler={handleAction}></Login>;
        }
    }

    const [machineState, setMachineState] = useState();
    const [flow, setFlow] = useState();
    const [loggedIn, setLoggedIn] = useState(false);
    const [step, setStep] = useState('login');
    const [username, setUsername] = useState();
    const [loginConfig] = useState('scan');
    const [reservedBooks] = useState([
        {
            id: '835535966-6',
            writer: 'Sofie Boysen',
            title: 'Pigerne mod drengene',
            status: bookStatus.RESERVED
        },
        {
            id: '294155315-0',
            writer: 'Sara Ejersbo',
            title: 'Den magiske sommer',
            status: bookStatus.RESERVED
        },
        {
            id: '104128583-3',
            writer: 'Åsa Larsson',
            title: 'Maren',
            status: bookStatus.READY_FOR_PICKUP
        }
    ]);

    const [loanedBooks, setLoanedBooks] = useState([]);
    const [justLoanedBooks, setJustLoanedBooks] = useState([]);
    const [justHandedInBooks, setJustHandedInBooks] = useState([]);
    const [scannedBarcode, setScannedBarcode] = useState('');
    const [library, setLibrary] = useState('Tranbjerg bibliotek');
    const store = {
        machineState: { get: machineState, set: setMachineState },
        step: { get: step, set: setStep },
        loggedIn: { get: loggedIn, set: setLoggedIn },
        username: { get: username, set: setUsername },
        loginConfig: { get: loginConfig },
        reservedBooks: { get: reservedBooks },
        loanedBooks: { get: loanedBooks, set: setLoanedBooks },
        flow: { get: flow, set: setFlow },
        scannedBarcode: { get: scannedBarcode, set: setScannedBarcode },
        justLoanedBooks: { get: justLoanedBooks, set: setJustLoanedBooks },
        justHandedInBooks: { get: justHandedInBooks, set: setJustHandedInBooks },
        library: { get: library, set: setLibrary }
    };
    return (
        <>
            <MachineStateContext.Provider value={store}>
                <NavBar actionHandler={handleAction}></NavBar>
                <div className="container">
                    <div className="row" style={{ width: '100%' }}>
                        {renderStep(step, machineState)}
                    </div>
                </div>
                <DebugBar actionHandler={handleAction}></DebugBar>
            </MachineStateContext.Provider>
        </>
    );
}

export default App;
