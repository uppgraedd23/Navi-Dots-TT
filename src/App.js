import React from 'react';
import './App.css';
import axios from "axios";

export default class GameField extends React.Component {
    state = {
        winners: [],
        winner: "",
        players: [],
        settings: {fields: 0, delay: 0, mode: ''},
        result: [],
        inputValue: "",
        passedCounter: 0,
        failedCounter: 0
    }
    timerId
    gameNode
    generateActiveItem = (freeElems) => {
        clearTimeout(this.timerId);
        const fields = this.state.settings.fields;
        const number = Math.floor(Math.random() * fields);
        const randomItemClasses = freeElems[number].classList

        if (randomItemClasses.contains('failed') || randomItemClasses.contains('passed')) {
            this.generateActiveItem(freeElems)
        } else {
            randomItemClasses.add("active")
            this.timerId = setTimeout(() => {
                this.state.failedCounter += 1;
                randomItemClasses.remove("active");
                if (this.state.failedCounter > fields / 2 || this.state.passedCounter > fields / 2) {
                    if (this.state.failedCounter > fields / 2) {
                        this.setState({
                            winner: "computer"
                        })
                        this.postTheWinner("computer")
                    } else {
                        this.setState({
                            winner: "user"
                        })
                        this.postTheWinner(this.state.settings.name)
                    }
                    this.gameNode.querySelector(".game-board").classList.add('disabled');
                } else {
                    randomItemClasses.add("failed");
                    this.generateActiveItem(freeElems)
                }
            }, this.state.settings.delay)
        }
    };

    startGame = () => {
        const {fields, delay, name} = this.state.settings;

        if (fields && delay && name) {
            this.gameNode.querySelector(".game-board").classList.remove('disabled');
            this.gameNode.querySelector(".game-settings").classList.add('disabled');
            this.generateActiveItem(this.gameNode.querySelectorAll(".game-board .game-board-item"))
        }
    }

    componentDidMount() {
        axios.get(`http://starnavi-frontend-test-task.herokuapp.com/winners/`)
            .then(response => {
                const winners = response.data.reverse();
                this.setState({winners});
            })
        axios.get(`http://starnavi-frontend-test-task.herokuapp.com/game-settings`)
            .then(res => {
                const result = Object.entries(res.data);
                this.setState({result});
            });
    }

    postTheWinner(name) {
        function formatDate(date) {
            var monthNames = [
                "January", "February", "March",
                "April", "May", "June", "July",
                "August", "September", "October",
                "November", "December"
            ];

            var hours = date.getHours();
            var minutes = date.getMinutes();
            var day = date.getDate();
            var monthIndex = date.getMonth();
            var year = date.getFullYear();

            return `${hours < 10 ? '0' + hours : hours}:${minutes < 10 ? '0' + minutes : minutes}; ${day} ${monthNames[monthIndex]} ${year}`;
        }

        axios.post(`http://starnavi-frontend-test-task.herokuapp.com/winners/`, {
            winner: name,
            date: formatDate(new Date())
        }).then(res => {
            const winners = res.data.reverse();
            this.setState({winners});
            const gameSettingsNode = this.gameNode.querySelector(".game-settings")
            gameSettingsNode.classList.remove('disabled');
            gameSettingsNode.querySelector(".settings-mode").classList.add('disabled');
            gameSettingsNode.querySelector(".settings-username").classList.add('disabled');
            gameSettingsNode.querySelector(".play-game").classList.add('hide');
            gameSettingsNode.querySelector(".play-again").classList.remove('hide');
        })
    }

    handleClick = (event) => {
        const fields = this.state.settings.fields;
        var elem = event.currentTarget
        var activeElem = elem.parentNode.querySelector(".game-board-item.active");

        if (elem.classList.contains("active")) {
            elem.classList.remove("active");
            elem.classList.add("passed");
            this.state.passedCounter += 1
        } else {
            activeElem.classList.remove("active");
            activeElem.classList.add("failed");
            this.state.failedCounter += 1
        }

        if (this.state.failedCounter > fields / 2 || this.state.passedCounter > fields / 2) {
            if (this.state.failedCounter > fields / 2) {
                this.setState({
                    winner: "computer"
                })
                this.postTheWinner("computer")
            } else {
                this.setState({
                    winner: "user"
                })
                this.postTheWinner(this.state.settings.name)
            }

            this.gameNode.querySelector(".game-board").classList.add('disabled');
        } else {
            this.generateActiveItem(this.gameNode.querySelectorAll(".game-board .game-board-item"))
        }
    };

    renderItems = (count) => {
        const items = []
        for (let i = 0; i < count; i++) {
            items.push(<div key={i} className="game-board-item" onClick={this.handleClick}></div>)
        }
        return items
    }

    handlerSelectChange = (e) => {
        const selectedOption = this.gameNode.querySelector('.mode-selector').selectedOptions[0];
        const field = selectedOption.getAttribute('data-field');
        const delay = selectedOption.getAttribute('data-delay');
        const mode = selectedOption.getAttribute('data-mode');
        this.setState({settings: {...this.state.settings, fields: field * field, delay, mode}});
    }

    handlerInputChange = (e) => {
        this.setState({settings: {...this.state.settings, name: e.target.value}});
    }

    playAgain = () => {
        this.setState({settings: {fields: 0, delay: 0, mode: ''}});
        const gameSettingsNode = this.gameNode.querySelector(".game-settings")
        gameSettingsNode.classList.remove('disabled');
        this.setState({
            passedCounter: 0,
            failedCounter: 0,
            winner: '',
            settings: {...this.state.settings, name: '', fields: 0}
        });
        this.gameNode.querySelector(".game-board").classList.remove('disabled');

        var allElems = this.gameNode.querySelectorAll(".gameitem");
        allElems.forEach(function (el) {
            el.classList.remove("failed");
            el.classList.remove("passed");
        });
        gameSettingsNode.querySelector(".settings-mode").classList.remove('disabled');
        gameSettingsNode.querySelector(".settings-username").classList.remove('disabled');
        gameSettingsNode.querySelector(".play-game").classList.remove('hide');
        gameSettingsNode.querySelector(".play-again").classList.add('hide');
        this.gameNode.querySelector('.mode-selector').selectedIndex = "0";
    }

    render() {
        const {winner, winners, result, settings} = this.state;
        const {fields, mode, name} = settings;
        return (
            <div className="game" ref={(input) => this.gameNode = input}>
                <div className="col-left">
                    <div className="game-settings">
                        <div className="settings-mode">
                            <select onChange={this.handlerSelectChange} className="mode-selector">
                                <option data-field={0} data-delay={0}>Pick game mode</option>
                                {result.map(item =>
                                    <option data-mode={item[0]} data-field={item[1].field}
                                            data-delay={item[1].delay}>{item[0]}</option>)}
                            </select>
                        </div>
                        <div className="settings-username">
                            <input className="username-input" onChange={this.handlerInputChange} type="text"
                                   placeholder="Enter your name"
                                   value={name}/>
                        </div>
                        <div className="settings-controll play-game">
                            <button onClick={this.startGame}>Play Game</button>
                        </div>
                        <div className="settings-controll play-again hide">
                            <button onClick={this.playAgain}>Play Again</button>
                        </div>
                    </div>
                    {winner && <span className="winner-message">Winner is: {winner}</span>}
                    {!!fields && (<div className={"game-board disabled " + mode}>
                        {this.renderItems(fields)}
                    </div>)}
                </div>
                <div className="col-right">
                    <div className="winners-list-title">Leader Board</div>
                    <div className="game-winners-list">
                        {winners.map(item => <div className="list-item">
                            <div className="list-item-name">{item.winner}</div>
                            <div className="list-item-date">{item.date}</div>
                        </div>)}
                    </div>
                </div>
            </div>
        )
    }
}