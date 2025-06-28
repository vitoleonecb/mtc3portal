
import React, { useState, useRef, useEffect }from 'react';
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

export function PendingButton({ moduleName, isAdmin }) {

    return (
        <button className={isAdmin ? "adminPendingButton" : "pendingButton"}>
            <span id="buttonText">{moduleName}</span>
            <div></div>
            <div></div>
            { isAdmin && (
                <svg className="pencilIconContainer" width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path className="pencilIcon" d="M2.76738 16C2.76738 16 1.49988 19 0.999939 20C0.5 21 4.53482 18.2222 4.53482 18.2222M2.76738 16L4.53482 18.2222M2.76738 16L14.924 2.24383M4.53482 18.2222L17.6802 5M17.6802 5L18.5004 4.17499C19.3108 3.35985 19.2596 2.0284 18.3891 1.27785V1.27785C17.5676 0.569597 16.3293 0.653647 15.611 1.46641L14.924 2.24383M17.6802 5L14.924 2.24383" stroke="white"/>
                </svg>
            )}
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
    
    const textareaRef = useRef(null);
    const [value, setValue] = useState('');

    const handleChange = (e) => {
        setValue(e.target.value);

        const textarea = textareaRef.current;
        if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
        }
    };

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
        }
    }, []);
    
    return (
        <textarea 
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        className="OpenResponse" 
        placeholder='Enter your response here'/>
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
            {options.map((option, index) => (
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

export function ScriptSampleNotate({ sample }) {
    return (
        <div className="ScriptSample">
            <h3 className="ScriptSampleText">{sample}</h3>
        </div>
    )
}

export function ScriptSampleRate({ sample }) {
    return (
        <div className="ScriptSampleRate">
            <h3 className="ScriptSampleText">{sample}</h3>
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
    
    const textareaRef = useRef(null);
    const [value, setValue] = useState('');

    const handleChange = (e) => {
        setValue(e.target.value);

        const textarea = textareaRef.current;
        if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
        }
    };

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
        }
    }, []);
    
    return (
        <>
            <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange} 
            placeholder="Enter your response here:" 
            className="ShortResponseArea">
            </textarea>
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
            <button onClick={handleClick} className="createButton" type="button">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="9.5" y1="0" x2="9.5" y2="18" stroke="black" />
                    <line y1="8.5" x2="18" y2="8.5" stroke="black" />
                </svg>
            </button>
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

export function DropDown({ options, onSelect, reset }) {
    
    const [isClicked, setIsClicked] = useState(false);
    const [selectedOption, setSelectedOption] = useState(null);
    const [dropDownLabel, setDropDownLabel] = useState('Select an option');

    const handleMainClick = () => {
        setIsClicked(prevStatus => !prevStatus);
    }

    const handleOptionClick = (option) => {
        setSelectedOption(option);
        setDropDownLabel(option);
        setIsClicked(false);
        onSelect(option);
    }

    useEffect(() => {
	setSelectedOption(null);
	setDropDownLabel('Select an option');
    }, [reset]);

    return (
        <>
            <div className="dropDownContainer">
 		 <div className="dropDownButton" onClick={handleMainClick}>
               		 <h2 id="dropDownText">{dropDownLabel}</h2>
               	 <div className="dropDownArrowContainer">
                    <svg className="dropDownArrow" style={{ transform: isClicked ? 'rotate(180deg)' : 'rotate(0deg)' }} width="23" height="11" viewBox="0 0 23 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M0.727539 0.727251L10.8387 10.2727L21.7275 0.72725" className="dropDownArrowPath" stroke="black" strokeLinecap="round"/>
                    </svg>
               	 </div>
           	 </div>
            
           	 { isClicked && (
               		 <ul className="dropDownOptionsBox">
                    		{options.map((option) => (
                        		<li className="dropDownOption" onClick={() => handleOptionClick(option)}>
                            			{option}
                        		</li>
                    		))}
                	 </ul>
            	 )}
	    </div>
        </>
    )
}
