import { MenuBarIcon, DragAndDropKey, ProgressBar } from './Icons.jsx';
import { ModuleEdge } from './EdgePages.jsx';
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
    CreateButton,
    DropDown } from './Buttons.jsx';
import { Heading1, Heading2, PromptInstruction, Completedheading, PendingHeading , OpenHeading , ProcessingHeading } from './Headings.jsx';
import React, { useRef, useState, useEffect, useContext, createContext } from 'react';

export function MultipleChoiceTemplate({ multipleChoiceOptions, onUpdateResponse, responseData, disabled }) {
    return (
      <>
        {multipleChoiceOptions.multipleChoicePrompts.map((promptData, qIndex) => (
          <div key={qIndex}>
            <Heading1 text={promptData.questionText} />
            <MultipleChoiceGroup
              options={promptData.options}
              disabled={disabled}
              // current answer for THIS question:
              currentAnswer={Array.isArray(responseData) ? responseData[qIndex] : undefined}
              // pass option index + label
              onChange={(optionIndex, label) =>
                onUpdateResponse(qIndex, promptData.questionText, optionIndex, true, label)
              }
            />
          </div>
        ))}
      </>
    );
  }

export function DropDownTemplate({responseData, dropDownOptions, onUpdateResponse, disabled}) {
    return (
        <>
            {dropDownOptions.dropDownPrompts.map((promptData, index) => (
                <div className="DropdownPromptContainer" key={index}>
                    <h1 className="Heading1" style={{ marginBottom: '20px' }}>{promptData.questionText}</h1>
                    <DropDown
                        disabled={disabled}
                        responseData={responseData?.[index] ?? {}}
                        options={promptData.options}
                        onChange={(label, optionIndex) => onUpdateResponse(index, promptData.questionText, optionIndex, false, label)}
                    />
                </div>
            ))}
        </>
    )
}

export function CheckListTemplate({ responseData, checkListOptions, onUpdateResponse, disabled }) {
  return (
    <>
      {checkListOptions.checkListPrompts.map((promptData, i) => (
        <div key={i}>
          <Heading1 text={promptData.questionText} />
          {promptData.options.map((label, j) => {
            const checked = !!responseData?.[i]?.options?.[j]?.selected;
            return (
              <CheckBoxButton
                key={j}
                disabled={disabled}
                checked={checked}
                optionText={label}
                onChange={(selected) =>
                  onUpdateResponse(i, promptData.questionText, j, selected, label)
                }
              />
            );
          })}
        </div>
      ))}
    </>
  );
}

export function ScriptNotationTemplate({responseData, disabled, reference, onUpdateResponse}) {
    return (
        <>
            <PromptInstruction question="Annotate the following script"/>
            <ScriptSampleNotate sample={reference} />
            <OpenResponse responseData={responseData?.['notationResponse']} disabled={disabled} onChange={(value) => onUpdateResponse(undefined, undefined, value)} />
            <ModuleNavigator />  
        </>
    )
}

export function SampleRaterTemplate({responseData, disabled, reference, onUpdateResponse}) {
    
    return (
        <>
            <PromptInstruction question="Rate the following"/>
            <ScriptSampleRate sample={reference} />
            <StarRater responseData={responseData?.['rating']} disabled={disabled} onChange={(value) => onUpdateResponse(undefined, undefined, String(value))}/>
        </>
    )
}

export function ShortResponseTemplate({responseData, disabled, shortResponseOptions, onUpdateResponse}) {
    
    return (
        <>
            {shortResponseOptions.questions.map((option, index) => (
                <div key={index}>
                    <Heading2 text={option.questionText}/>
                    <ShortResponseArea responseData={responseData?.[index]?.['answer'] ?? ''} disabled={disabled} onChange={(value) => onUpdateResponse(index, option.questionText, value)}/>
                </div>
            ))}
        </>
    )
}

export function DragAndDropTemplate({ dragOptions, onInitialPositions, onUpdateResponse, disabled, responseData }) {
    return (
        <>
            <DragAndDropArea responseData={responseData} onUpdateResponse={onUpdateResponse} disabled={disabled} dragOptions={dragOptions} onInitialPositions={onInitialPositions} />
            <DragAndDropKey dragOptions={dragOptions} />
        </>
    );
}