
import React, { useState, useRef }from 'react';
import { DragElement, ArrowSVG, Star, BackArrowSVG, CheckBox, ForwardArrowIcon } from './Icons';
import classNames from 'classnames';
import { motion } from 'framer-motion';
import { Link, useParams, useNavigate } from 'react-router-dom';

export function CompleteButton({ moduleName }) {
    return (
    <button className="completeButton">
        <span id="buttonText">{moduleName}</span>
        <div></div>
        <div></div>
        <ArrowSVG />
    </button>
    );
}

export function ProcessingButton() {
    return (
    <button className="processingButton">
        <span id="buttonText">Module</span>
        <div className="progressContainer">
            <progress className="processingProgress" value="50" max="100"></progress>
        </div>
        <span id="buttonTimeText">2 Days</span>
    </button>
    );
}

export function PendingButton({ moduleName }) {
    return (
    <button className="pendingButton">
        <span id="buttonText">{moduleName}</span>
    </button>
    );
}

export function OpenButton({ moduleName, progressValue }) {
    return (
    <button className="openButton">
        <span id="buttonText">{moduleName}</span>
        <div className="progressContainer">
            <progress className="openProgress" value={progressValue} max="100"></progress>
        </div>
        <span id="buttonTimeText">72 hrs</span>
        <ArrowSVG />
    </button>
    );
}

export function OpenResponse() {
    return (
        <textarea className="OpenResponse" placeholder='Enter your response here'/>
    )
}

export function ModuleNavigator({backActive, backClick, nextClick}) {
    return (
        <>
            <div className='moduleNavigatorContainer'>
                <div>
                    <button className='previousButton' onClick={backClick} style={{display: backActive ? 'none' : 'block'}}>
                        <BackArrowSVG />
                    </button>
                </div>
                <button className='nextButton' onClick={nextClick}>
                    <ArrowSVG />
                </button>
            </div>
        </>
    )
}

export function CheckBoxButton({optionText = 'Not Available'}) {
    
    const [color, setColor] = useState('white')
    const [isLocked, setIsLocked] = useState(false)

    function handleMouseEnter() {
        if (!isLocked) {
            setColor('#D2A478');
        }
    }

    function handleMouseLeave() {
        if (!isLocked) {
            setColor('white');
        }
    }

    function handleClick() {
        if (!isLocked) {
            setIsLocked(true);
            setColor('#D2A478');
        }
        else {
            setIsLocked(false)
            setColor('white')
        }
    }
    
    return (
        <>
            <button onClick={handleClick} onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave} className="checkBoxButton">
                <CheckBox color={color}/>
                <span id="buttonText">{optionText}</span>
            </button>
        </>
    )
}

export function MultipleChoiceButton({isSelected, onSelect, label}) {

    // const styles = {
    //     border: isSelected ? 'none' : 'black 1px solid',
    //     backgroundColor: isSelected ? '#D2A478' : 'white',
    //     color: isSelected ? 'white' : 'black',
    //     boxShadow: isSelected ? 'none' : '-4px 4px black'
    // };

    const buttonClass = classNames('multipleChoiceButton', {
        'selected': isSelected,
    });

    // function handleMouseEnter() {
    //     styles.border = 'none';
    //     styles.backgroundColor = '#D2A478'
    //     styles.color = 'white';
    //     styles.boxShadow ='none';
    // };

    // function handleMouseLeave() {

    // };

    function handleClick() {
        if (!isSelected) {
            onSelect();
        }
    };
    
    return (
        <>
            <button 
                // style={styles}
                onClick={handleClick} 
                // onMouseEnter={handleMouseEnter} 
                // onMouseLeave={handleMouseLeave} 
                className={buttonClass}
                disabled={isSelected}
            >
                <span id="multipleChoiceText">{label}</span>
            </button>
        </>
    )
};

export function MultipleChoiceGroup({options}) {
    const [selectedOption, setSelectedOption] = useState(null);

    const handleSelect = (option) => {
        setSelectedOption(option);
    }
    
    return (
        <>
            {Object.values(options).map((option, index) => (
                <MultipleChoiceButton 
                    key={index}
                    label={option}
                    isSelected={selectedOption === option}
                    onSelect={() => handleSelect(option)}
                />
            ))}
        </>
    )
}

export function ScriptSampleNotate(props) {
    return (
        <div className="ScriptSample">
            <h3 className="ScriptSampleText">{props.sample}</h3>
        </div>
    )
}

export function ScriptSampleRate(props) {
    return (
        <div className="ScriptSampleRate">
            <h3 className="ScriptSampleText">{props.sample}</h3>
        </div>
    )
}

export function StarRater() {
    
    const [hoveredRating, setHoveredRating] = useState(0);
    const [selectedRating, setSelectedRating] = useState(0);

    const handleMouseEnter = (index) => {
        setHoveredRating(index);
    };

    const handleMouseLeave = () => {
        setHoveredRating(0);
    };

    const handleClick = (index) => {
        setSelectedRating(index);
    }
    
    return (
        <div className="StarContainer">
            {
                [1,2,3,4,5].map((star) => (
                    <Star key={star} 
                    selected={hoveredRating >= star || (!hoveredRating && selectedRating >= star)} 
                    onMouseEnter={() => handleMouseEnter(star)} 
                    onMouseLeave={handleMouseLeave} 
                    onClick={() => handleClick(star)}
                    />
                    )
                )
            }
        </div>
    )
}

export function ShortResponseArea() {
    return (
        <>
            <textarea placeholder="Enter your response here:" className="ShortResponseArea"></textarea>
        </>
    )
}

export function DragAndDropArea() {
    const constraintRef = useRef(null)
    return (
        <div className="DragAndDropContainer" ref={constraintRef}>            
            {
                ['#994242','#D2A478','#57A15E','#FFFFFF','#000000','#D9D9D9'].map((color, index) => (
                    <DragElement key={index} color={color} dragConstraints={constraintRef}/>
                ))
            }
        </div>
    )
}

export function NextButton({ onClick, text = "Next" }) {
    return (
        <div className="logInButtonContainer">
            <button onClick={ onClick } className="logInButton">{text}</button>
        </div>
    );
}

export function YesNoButton({ onClickYes, onClickNo }) {
    return (
        <div className="logInButtonContainer">
            <button onClick={ onClickYes } className="logInButton">Yes</button>
            <button onClick={ onClickNo } className="logInButton">No</button>
        </div>
    );
}


export function LogInButton() {
    return (
        <div className="logInButtonContainer">
            <input className="logInButton" type="submit"/>
        </div>
    );
}

export function CreateButton({ handleClick }) {
    return (
        <div className="createButtonContainer">
            <input onClick={ handleClick } className="createButton" type="button"/>
        </div>
    );
}

export function WorkshopCard({ workshopName, workshopLocation, workshopDate, workshopDescription }) {
    return (
        <>
            <div className="workshopCardContainer">
                <div>
                    <h1 className="workshopCardName">{workshopName}</h1>
                    <span id="buttonText">{'When: ' + workshopDate}</span>
                    <span id="buttonText">{'Where: ' + workshopLocation}</span>
                    <span id="workshopCardDescription">{workshopDescription}</span>
                </div>

                <div>
                    <ArrowSVG />
                </div>

            </div>
        </>
    )
}

export function MainNavCard({color, text, link}) {
    return (
        <div className="MainNavCardContainer" style={{ backgroundColor: color}}>
            <div className="MainNavCardLabel">
                <span className="MainNavCardTitle">{text}</span>
                <span className="MainNavCardDesc"></span>
            </div>
            <Link to={link}><ForwardArrowIcon /></Link>
        </div>
    )
}