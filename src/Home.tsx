import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button, Flex } from "antd";

import "./css/home.css";

const buttonStyles = {
    background: "rgba(0, 0, 0, 0.2)",
};

// Главная страница
const WalletEntry: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        // Проверяем наличие сохраненных аккаунтов
        const savedAccounts = localStorage.getItem('walletAccounts');
        const accounts = savedAccounts ? JSON.parse(savedAccounts) : [];
        
        if (accounts.length > 0) {
            // Если есть аккаунты, проверяем текущий аккаунт
            const currentAccount = localStorage.getItem('currentAccount');
            if (currentAccount) {
                // Если есть текущий аккаунт, перенаправляем на страницу баланса
                navigate('/HomeBalance');
                return;
            } else {
                // Если нет текущего аккаунта, устанавливаем первый аккаунт как текущий
                localStorage.setItem('currentAccount', JSON.stringify(accounts[0]));
                navigate('/HomeBalance');
                return;
            }
        }
    }, [navigate]);

    const handleLogin = () => {
        navigate("/login");
    };

    const handleCreateNewWallet = () => {
        navigate("/create");
    };

    const test = () => {
        navigate("/test");
    };

    return (
        <div className="container">
            <header className="header">
                <h1>Welcome to Reliable Wallet</h1>
            </header>

            <div className="body">
                <div className="content">
                    <p className="subText">Choose an option:</p>
                    <div className="buttonContainer">
                        <Flex vertical gap="small" style={{ width: "100%" }}>
                            <Button
                                className="customButton"
                                color="default"
                                variant="filled"
                                onClick={handleCreateNewWallet}
                                style={buttonStyles}
                                block
                            >
                                Create
                            </Button>
                            <Button
                                className="customButton"
                                color="default"
                                variant="filled"
                                onClick={handleLogin}
                                style={buttonStyles}
                                block
                            >
                                Log in
                            </Button>
                            {/* <Button
                                className="customButton"
                                color="default"
                                variant="filled"
                                onClick={test}
                                style={buttonStyles}
                                block
                            >
                                test
                            </Button> */}
                        </Flex>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WalletEntry;
