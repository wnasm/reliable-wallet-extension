import React from "react";
import { useNavigate } from 'react-router-dom';
import { FaArrowLeftLong } from "react-icons/fa6";
import IconButton from "./libs/IconButton";

import './css/settings.css';
import { Button } from "antd";


const Settings: React.FC = () => {

    const navigate = useNavigate();


    return (
        <div className="container">
            <header className="header">
                <IconButton className="back-icon" style={{}} icon={<FaArrowLeftLong style={{ fill: 'pink' }} size={24} />} onClick={() => navigate(-1)} />

                <h2 className="title-settings">Settings</h2>
            </header>

            <div className="body">
                <div className="content colums-settings">

                    <div className="main-settings">
                        <Button
                            className="mainButton-settings"
                            onClick={() => navigate('/networks')}
                        ><h3 className="h3-settings">Networks</h3>
                        </Button>
                        <Button className="mainButton-settings"
                            onClick={() => navigate('/addNetwork')}
                        ><h3 className="h3-settings">Add Network</h3>
                        </Button>
                        <Button
                            className="mainButton-settings"
                            onClick={() => navigate('/backup')}
                        ><h3 className="h3-settings">Backup Wallet</h3>
                        </Button>

                    </div>

                </div>
            </div>
        </div>
    );
}

export default Settings