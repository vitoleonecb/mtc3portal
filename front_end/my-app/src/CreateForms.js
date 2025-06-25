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
import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';

export function CreateCheckListTemplate({ savedData, onChange }) {
    
    const [questions, setQuestions] = useState(
        Array.isArray(savedData) && savedData.length > 0
          ? savedData
          : [{ questionText: '', options: [''] }]
      );
      
      useEffect(() => {
        if (Array.isArray(savedData) && savedData.length > 0) {
          setQuestions(savedData);
        }
      }, [savedData]);

    const handleQuestionChange = (index, value) => {
        setQuestions(prev => { 
            const updated = prev.map((q, i) =>
                i === index ? {...q, questionText: value} : q
            );
            onChange(updated);
            return updated;
        });    
    };

    const handleOptionChange = (qIndex, optIndex, value) => {
        setQuestions(prev => {
            const updated = prev.map((q, i) => {
                if (i !== qIndex) return q;
                const updatedOptions = [...q.options];
                updatedOptions[optIndex] = value;
                return { ...q, options: updatedOptions };
            });
            onChange(updated);
            return updated;
        });
    };

    const addQuestion = () => {
        setQuestions(prev => {
            const updated = [...prev, { questionText: '', options: [''] }];
            onChange(updated);
            return updated;
        });
    };
    
    const addOption = (qIndex) => {
        setQuestions(prev => {
            const updated = prev.map((q, i) =>
                i === qIndex ? { ...q, options: [...q.options, ''] } : q
            );
            onChange(updated);
            return updated;
        });
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

export function CreateMultipleChoiceTemplate({ savedData, onChange }) {
    
    const [questions, setQuestions] = useState(
        Array.isArray(savedData) && savedData.length > 0
          ? savedData
          : [{ questionText: '', options: [''] }]
      );
      
      useEffect(() => {
        if (Array.isArray(savedData) && savedData.length > 0) {
          setQuestions(savedData);
        }
      }, [savedData]);

    const handleQuestionChange = (index, value) => {
        setQuestions(prev => { 
            const updated = prev.map((q, i) =>
                i === index ? {...q, questionText: value} : q
            );
            onChange(updated);
            return updated;
        });    
    };

    const handleOptionChange = (qIndex, optIndex, value) => {
        setQuestions(prev => {
            const updated = prev.map((q, i) => {
                if (i !== qIndex) return q;
                const updatedOptions = [...q.options];
                updatedOptions[optIndex] = value;
                return { ...q, options: updatedOptions };
            });
            onChange(updated);
            return updated;
        });
    };

    const addQuestion = () => {
        setQuestions(prev => {
            const updated = [...prev, { questionText: '', options: [''] }];
            onChange(updated);
            return updated;
        });
    };
    
    const addOption = (qIndex) => {
        setQuestions(prev => {
            const updated = prev.map((q, i) =>
                i === qIndex ? { ...q, options: [...q.options, ''] } : q
            );
            onChange(updated);
            return updated;
        });
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

export function CreateShortResponseTemplate({ savedData, onChange }) {
    
    const [questions, setQuestions] = useState(
        Array.isArray(savedData) && savedData.length > 0
          ? savedData
          : [{ questionText: '' }]
      );

    useEffect(() => {
    if (Array.isArray(savedData) && savedData.length > 0) {
        setQuestions(savedData);
    }
    }, [savedData]);

    const handleQuestionChange = (index, value) => {
        setQuestions(prev => { 
            const updated = prev.map((q, i) =>
                i === index ? {...q, questionText: value} : q
            );
            onChange(updated);
            return updated;
        }); 
    }

    const addQuestion = () => {
        setQuestions((prev) => {
            const updated = [...prev, { questionText: '' }];
            onChange(updated);
            return updated;
        })
    }

    return (
        <>
            {questions.map((q, qIndex) => (
                <input
                    value={q.questionText}
                    onChange={(e) => handleQuestionChange(qIndex, e.target.value)}
                    className='textInput' 
                    placeholder='Enter question' 
                    type='text'
                />)
            )};

            <CreateButton handleClick={addQuestion}/>
        </>
    )
}

export function CreateDragAndDropTemplate({ savedData, onChange }) {
    
    const [options, setOptions] = useState(
        Array.isArray(savedData) && savedData.length > 0
          ? savedData
          : ['']
      );
    
    const handleOptionChange = (index, value) => {
        setOptions((prev) => {
            const updated = prev.map((o, i) =>
                i === index ? value : o
            );
            onChange(updated);
            return updated;
        });
    }

    const addName = () => {
	setOptions((prev) => [...prev, '']);
    }

    return (
        <>
            {options.map((option, optionIndex) => (
                <input
                    value={option}
                    onChange={(e) => handleOptionChange(optionIndex, e.target.value)}
                    className='textInput' 
                    placeholder='Enter a name' 
                    type='text'
                />
            ))}
	    <CreateButton handleClick={addName}/>
        </>
    )
}

export function CreateSampleRaterTemplate({ savedData, onChange }) {
    
    const [reference, setReference] = useState(
        typeof savedData === 'object' && Object.keys(savedData).length > 0
          ? savedData
          : { referenceText: '' }
      );
    const textareaRef = useRef(null);
    
    useEffect(() => {
	const textarea = textareaRef.current;
	if (textarea) {
	   textarea.style.height = 'auto';
           textarea.style.height = textarea.scrollHeight + 'px';        
        }    
    }, [reference.refrenceText]);

    const handleQuestionChange = (e) => {
        
        setReference({ referenceText: e.target.value });
        onChange({ referenceText: e.target.value });

        const textarea = textareaRef.current;
        if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
        }
    }

    return (
        <>
            <textarea
                ref={textareaRef}
                value={reference.referenceText}
                onChange={handleQuestionChange}
                className='OpenResponse' 
                placeholder='Enter Sample Text'
            />
        </>
    )
}

export function CreateScriptNotationTemplate({ savedData, onChange }) {
    
    const [reference, setReference] = useState(
        typeof savedData === 'object' && Object.keys(savedData).length > 0
          ? savedData
          : { referenceText: '' }
      );
    const textareaRef = useRef(null);

    const handleQuestionChange = (e) => {
        
        setReference({ referenceText: e.target.value });
        onChange({ referenceText: e.target.value });

        const textarea = textareaRef.current;
        if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
        }
    }

    return (
        <>
            <textarea
                ref={textareaRef}
                value={reference.referenceText}
                onChange={handleQuestionChange}
                className='OpenResponse' 
                placeholder='Enter Sample Text'
            />
        </>
    )
}

export function CreateDropDownTemplate({ savedData, onChange }) {
    
    const [questions, setQuestions] = useState(
        Array.isArray(savedData) && savedData.length > 0
          ? savedData
          : [{ questionText: '', options: [''] }]
      );
      
      useEffect(() => {
        if (Array.isArray(savedData) && savedData.length > 0) {
          setQuestions(savedData);
        }
      }, [savedData]);

    const handleQuestionChange = (index, value) => {
        setQuestions(prev => { 
            const updated = prev.map((q, i) =>
                i === index ? {...q, questionText: value} : q
            );
            onChange(updated);
            return updated;
        });    
    };

    const handleOptionChange = (qIndex, optIndex, value) => {
        setQuestions(prev => {
            const updated = prev.map((q, i) => {
                if (i !== qIndex) return q;
                const updatedOptions = [...q.options];
                updatedOptions[optIndex] = value;
                return { ...q, options: updatedOptions };
            });
            onChange(updated);
            return updated;
        });
    };

    const addQuestion = () => {
        setQuestions(prev => {
            const updated = [...prev, { questionText: '', options: [''] }];
            onChange(updated);
            return updated;
        });
    };
    
    const addOption = (qIndex) => {
        setQuestions(prev => {
            const updated = prev.map((q, i) =>
                i === qIndex ? { ...q, options: [...q.options, ''] } : q
            );
            onChange(updated);
            return updated;
        });
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
