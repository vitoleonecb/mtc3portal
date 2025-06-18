/// FORMS FOR CREATING WORKSHOPS, MODULES, PROMPTS

import { MenuBarIcon, DragAndDropKey } from './Icons.js';
import { ModuleHeader } from './ModuleHeader.js'
import { OpenResponse, 
    ScriptSampleNotate, 
    ScriptSampleRate, 
    CheckBoxButton, 
    ModuleNavigator, 
    PendingButton, 
    CompleteButton, 
    OpenButton, 
    ProcessingButton, 
    MultipleChoiceGroup,
    ShortResponseArea,
    DragAndDropArea,
    MainNavCard,
    StarRater,
    LogInButton,
    NextButton,
    YesNoButton,
    WorkshopCard,
    CreateButton } from './Buttons.js';
import { Heading1, Heading2, PromptInstruction, Completedheading, PendingHeading , OpenHeading , ProcessingHeading } from './Headings.js';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';

export function CreateCheckListTemplate() {
    
    const [questions, setQuestions] = useState([
        { questionText: '', options: [""] }
    ]);

    const handleQuestionChange = (index, value) => {
        setQuestions(prev => 
            prev.map((q, i) =>
                i === index ? {...q, questionText: value} : q
            )
        );
    };

    const handleOptionChange = (qIndex, optIndex, value) => {
        setQuestions(prev =>
            prev.map((q, i) => {
                if (i !== qIndex) return q;
                const updatedOptions = [...q.options];
                updatedOptions[optIndex] = value;
                return { ...q, options: updatedOptions };
            })
        );
    };

    const addQuestion = () => {
        setQuestions(prev => [...prev, { questionText: '', options: [''] }])
    }

    const addOption = (qIndex) => {
        setQuestions(prev =>
            prev.map((q, i) =>
                i === qIndex
                    ? { ...q, options: [...q.options, ''] }
                    : q
            )
        );
    };

    return (
        <>
            {questions.map((q, qIndex) => (
               <div key={qIndex} className="createChecklistQuestionContainer">
                    <input
                        value={q.questionText}
                        onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                        className='createTextInput' 
                        placeholder='Enter question' 
                        type='text'
                    />

                    <div className="createChecklistOptionsContainer">
                        
                        {q.options.map((opt, optIndex) => (
                                <input
                                key={optIndex}
                                value={opt}
                                onChange={(e) => handleOptionChange(qIndex, optIndex, e.target.value)}
                                placeholder={`Option ${optIndex + 1}`}
                                className='createTextInput'
                                type='text'
                                style={{ marginBottom: '10px', border: '#D2A478 1px solid'}}
                                />
                            
                        ))}
                    </div>

                    

                    <CreateButton handleClick={() => addOption(qIndex)} />
                </div>
               
            ))}
            
            <CreateButton handleClick={addQuestion}/>
        </>
    );
}

export function CreateMultipleChoiceTemplate() {
    
    return (
        <>
        
        </>
    )
}

export function CreateShortResponseTemplate() {
    
    return (
        <>
        
        </>
    )
}

export function CreateDragAndDropTemplate() {
    
    return (
        <>
        
        </>
    )
}

export function CreateSampleRaterTemplate() {
    
    return (
        <>
        
        </>
    )
}

export function CreateScriptNotationTemplate() {
    
    return (
        <>
        
        </>
    )
}

export function CreateDropDownTemplate() {
    
    return (
        <>
        
        </>
    )
}
