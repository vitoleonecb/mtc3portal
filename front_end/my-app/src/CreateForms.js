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
        Array.isArray(savedData.checkListPrompts) && savedData.checkListPrompts.length > 0
          ? savedData.checkListPrompts
          : [{ questionText: '', options: [''] }]
      );
      
      useEffect(() => {
        if (Array.isArray(savedData.checkListPrompts) && savedData.checkListPrompts.length > 0) {
          setQuestions(savedData.checkListPrompts);
        }
      }, [savedData]);

    const handleQuestionChange = (index, value) => {
        setQuestions(prev => { 
            const updated = prev.map((q, i) =>
                i === index ? {...q, questionText: value} : q
            );
            onChange({checkListPrompts: updated});
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
            onChange({checkListPrompts: updated});
            return updated;
        });
    };

    const addQuestion = () => {
        setQuestions(prev => {
            const updated = [...prev, { questionText: '', options: [''] }];
            onChange({checkListPrompts: updated});
            return updated;
        });
    };
    
    const addOption = (qIndex) => {
        setQuestions(prev => {
            const updated = prev.map((q, i) =>
                i === qIndex ? { ...q, options: [...q.options, ''] } : q
            );
            onChange({checkListPrompts: updated});
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
        Array.isArray(savedData.multipleChoicePrompts) && savedData.multipleChoicePrompts.length > 0
          ? savedData.multipleChoicePrompts
          : [{ questionText: '', options: [''] }]
      );
      
      useEffect(() => {
        if (Array.isArray(savedData.multipleChoicePrompts) && savedData.multipleChoicePrompts.length > 0) {
          setQuestions(savedData.multipleChoicePrompts);
        }
      }, [savedData]);

    const handleQuestionChange = (index, value) => {
        setQuestions(prev => { 
            const updated = prev.map((q, i) =>
                i === index ? {...q, questionText: value} : q
            );
            onChange({multipleChoicePrompts: updated});
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
            onChange({multipleChoicePrompts: updated});
            return updated;
        });
    };

    const addQuestion = () => {
        setQuestions(prev => {
            const updated = [...prev, { questionText: '', options: [''] }];
            onChange({multipleChoicePrompts: updated});
            return updated;
        });
    };
    
    const addOption = (qIndex) => {
        setQuestions(prev => {
            const updated = prev.map((q, i) =>
                i === qIndex ? { ...q, options: [...q.options, ''] } : q
            );
            onChange({multipleChoicePrompts: updated});
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
        Array.isArray(savedData?.questions) && savedData.questions.length > 0
          ? savedData.questions
          : [{ questionText: '' }]
      );

    useEffect(() => {
        if (Array.isArray(savedData?.questions) && savedData.questions.length > 0) {
            setQuestions(savedData.questions);
        }
    }, [savedData]);

    const handleQuestionChange = (index, value) => {
        setQuestions(prev => { 
            const updated = prev.map((q, i) =>
                i === index ? {...q, questionText: value} : q
            );
            onChange({ questions: updated });
            return updated;
        }); 
    }

    const addQuestion = () => {
        setQuestions((prev) => {
            const updated = [...prev, { questionText: '' }];
            onChange({ questions: updated });
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
        Array.isArray(savedData?.options) && savedData.options.length > 0
          ? savedData.options
          : [{optionName: ''}]
      );
    
    const handleOptionChange = (index, value) => {
        setOptions((prev) => {
            const updated = prev.map((o, i) =>
                i === index ? { optionName: value } : o
            );
            onChange({options: updated});
            return updated;
        });
    }

    const addName = () => {
        setOptions((prev) => {
            const updated = [...prev, { optionName: '' }];
            onChange({ options: updated });
            return updated;
        });
    };

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
        Array.isArray(savedData.dropDownPrompts) && savedData.dropDownPrompts.length > 0
          ? savedData.dropDownPrompts
          : [{ questionText: '', options: [''] }]
      );
      
      useEffect(() => {
        if (Array.isArray(savedData.dropDownPrompts) && savedData.dropDownPrompts.length > 0) {
          setQuestions(savedData.dropDownPrompts);
        }
      }, [savedData]);

    const handleQuestionChange = (index, value) => {
        setQuestions(prev => { 
            const updated = prev.map((q, i) =>
                i === index ? {...q, questionText: value} : q
            );
            onChange({dropDownPrompts: updated});
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
            onChange({dropDownPrompts: updated});
            return updated;
        });
    };

    const addQuestion = () => {
        setQuestions(prev => {
            const updated = [...prev, { questionText: '', options: [''] }];
            onChange({dropDownPrompts: updated});
            return updated;
        });
    };
    
    const addOption = (qIndex) => {
        setQuestions(prev => {
            const updated = prev.map((q, i) =>
                i === qIndex ? { ...q, options: [...q.options, ''] } : q
            );
            onChange({dropDownPrompts: updated});
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
