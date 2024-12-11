import React, { useEffect, useState } from 'react';
import AdvancedQRCode from './libs/QRCodeGenerator';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeftLong } from 'react-icons/fa6';
import IconButton from './libs/IconButton';
import { Button, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';

import "./css/qrcode.css";

const QrCode: React.FC = () => {
    const logo = require('./img/icon.webp');
    const [walletAddress, setWalletAddress] = useState('');
    const [avatarImage, setAvatarImage] = useState<string | null>(null);

    const navigate = useNavigate();

    useEffect(() => {
        setWalletAddress(localStorage.getItem('walletAddress'));
    }, []);

    useEffect(() => {
        setAvatarImage(localStorage.getItem('walletAvatar'));
    });

    // Настроим контейнер для сообщений
    useEffect(() => {
        message.config({
            getContainer: () => document.querySelector('.message-container') || document.body,
        });
    }, []);

    return (
        <div className='container'>
            <header className="header">
                <IconButton className="back-icon" style={{}} icon={<FaArrowLeftLong style={{ fill: 'pink' }} size={24} />} onClick={() => navigate(-1)} />

                <span>Recive</span>

                {avatarImage && <img className='avatar-qrcode' src={avatarImage} alt="Avatar" />}
            </header>

            <div className="body">
                <div className="content">
                    <div className="message-container"></div>
                    <AdvancedQRCode
                        value={walletAddress}
                        logoUrl={logo}
                        logoPaddingStyle="square"
                        size={180}
                        bgColor="white"
                        fgColor="black"
                        qrStyle="dots"
                        eyeRadius={2}
                        eyeColor="black"
                        style={{
                            borderRadius: '20px',
                        }}
                    />
                    <div className="addressCopy-qrcode">
                        <span className='address-qrcode'>{walletAddress}</span>
                        <Button
                            className='copyButton-qrcode defaultButton'
                            onClick={() => {
                                message.success({
                                    content: 'Copied to clipboard',
                                    duration: 1.5,
                                    // className: 'messageSuccess-qrcode',
                                });
                                navigator.clipboard.writeText(walletAddress);
                            }}
                            icon={<CopyOutlined style={{ fill: 'pink' }} size={24} />}
                        >Copy Address</Button>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default QrCode;
