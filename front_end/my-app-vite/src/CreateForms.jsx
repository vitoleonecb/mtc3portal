/// FORMS FOR CREATING WORKSHOPS, MODULES, PROMPTS

import { MenuBarIcon, DragAndDropKey } from './Icons.jsx';
import { ModuleHeader } from './ModuleHeader.jsx'
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
    CreateButton } from './Buttons.jsx';
import { Heading1, Heading2, PromptInstruction, Completedheading, PendingHeading , OpenHeading , ProcessingHeading } from './Headings.jsx';
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

const slug = s => (s || "").toLowerCase().trim()
  .replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
const makeId = () => (crypto?.randomUUID?.() ?? `id_${Date.now()}_${Math.random().toString(36).slice(2)}`);

function uniquify(base, taken) {
  if (!taken.has(base)) { taken.add(base); return base; }
  let n = 2;
  while (taken.has(`${base}-${n}`)) n++;
  const u = `${base}-${n}`;
  taken.add(u);
  return u;
}

// Drag & Drop prompt editor now works with a richer layout config
// supporting "free", "x-spectrum", and "grid-zones" layouts.
export function CreateDragAndDropTemplate({ savedData, onChange }) {
  // Full config object persisted to workshop_prompt_options
  const [config, setConfig] = useState(() => {
    if (savedData && Object.keys(savedData).length > 0) {
      // Assume savedData is already a full config
      // Ensure options carry stable ids/keys
      const baseOpts = Array.isArray(savedData.options) && savedData.options.length
        ? savedData.options
        : [{ optionName: "", optionKey: "", optionId: makeId() }];

      return {
        layout: savedData.layout || 'free',
        axes: savedData.axes || {},
        grid: savedData.grid || null,
        options: baseOpts.map(o => ({
          optionId: o.optionId || makeId(),
          optionName: o.optionName ?? "",
          optionKey: o.optionKey ?? "",
        })),
      };
    }

    // Default: free placement with a single unnamed option
    return {
      layout: 'free',
      axes: {},
      grid: null,
      options: [
        { optionId: makeId(), optionName: "", optionKey: "" },
      ],
    };
  });

  const sync = (nextConfig) => {
    setConfig(nextConfig);
    onChange(nextConfig);
  };

  const updateOptionName = (idx, value) => {
    const nextOpts = config.options.map((o, i) =>
      i === idx ? { ...o, optionName: value } : o
    );
    sync({ ...config, options: nextOpts });
  };

  const handleBlurOptions = () => {
    // (re)build unique keys from names once per edit session
    const taken = new Set();
    const nextOpts = config.options.map(o => {
      const base = slug(o.optionName) || "item";
      const key = uniquify(base, taken);
      return { ...o, optionKey: key };
    });
    sync({ ...config, options: nextOpts });
  };

  const addOption = () => {
    const nextOpts = [
      ...config.options,
      { optionId: makeId(), optionName: "", optionKey: "" },
    ];
    sync({ ...config, options: nextOpts });
  };

  const handleLayoutChange = (layout) => {
    sync({ ...config, layout });
  };

  const handleSpectrumAxisChange = (side, value) => {
    sync({
      ...config,
      axes: {
        ...(config.axes || {}),
        x: {
          ...(config.axes?.x || {}),
          [side]: value,
        },
      },
    });
  };

  const handleGridChange = (field, raw) => {
    const num = Math.max(1, Number(raw) || 1);

    // Ensure both dimensions have sensible defaults so we always
    // get visible vertical lines even if the user only edits rows.
    const baseGrid = config.grid || { rows: 1, cols: 5 };

    sync({
      ...config,
      grid: {
        ...baseGrid,
        [field]: num,
      },
    });
  };

  return (
    <>
      {/* Layout selector: free vs spectrum vs grid-zones */}
      <select
        value={config.layout || 'free'}
        onChange={e => handleLayoutChange(e.target.value)}
        className="textInput"
      >
        <option value="free">Free placement</option>
        <option value="x-spectrum">Horizontal spectrum</option>
        <option value="grid-zones">Grid of zones</option>
      </select>

      {/* Spectrum configuration */}
      {config.layout === 'x-spectrum' && (
        <div className="createChecklistQuestionContainer">
          <input
            type="text"
            className="createTextInput"
            placeholder="Left pole label (e.g. 'Strongly Disagree')"
            value={config.axes?.x?.labelMin || ''}
            onChange={e => handleSpectrumAxisChange('labelMin', e.target.value)}
          />
          <input
            type="text"
            className="createTextInput"
            placeholder="Right pole label (e.g. 'Strongly Agree')"
            value={config.axes?.x?.labelMax || ''}
            onChange={e => handleSpectrumAxisChange('labelMax', e.target.value)}
          />
        </div>
      )}

      {/* Grid configuration for zoning */}
      {config.layout === 'grid-zones' && (
        <div className="createChecklistQuestionContainer">
          <input
            type="number"
            min={1}
            max={10}
            className="createTextInput"
            placeholder="Number of rows"
            value={config.grid?.rows || 1}
            onChange={e => handleGridChange('rows', e.target.value)}
          />
          <input
            type="number"
            min={1}
            max={10}
            className="createTextInput"
            placeholder="Number of columns"
            value={config.grid?.cols || 5}
            onChange={e => handleGridChange('cols', e.target.value)}
          />
        </div>
      )}

      {/* Draggable item labels */}
      {config.options.map((o, i) => (
        <input
          key={o.optionId}
          value={o.optionName}
          onChange={e => updateOptionName(i, e.target.value)}
          onBlur={handleBlurOptions}
          className="textInput"
          placeholder="Enter a name"
          type="text"
        />
      ))}

      <CreateButton handleClick={addOption}/>
    </>
  );
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
