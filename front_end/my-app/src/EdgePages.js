import { MenuBarIcon, DragAndDropKey, ProgressBar } from './Icons.js';
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
    CreateButton,
    DropDown } from './Buttons.js';
import { Heading1, Heading2, PromptInstruction, Completedheading, PendingHeading , OpenHeading , ProcessingHeading } from './Headings.js';
import React, { useRef, useState, useEffect, useContext, createContext } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { Link, useParams, useNavigate, Outlet, useLocation, useMatch } from 'react-router-dom';
import { format } from 'date-fns';

export function FinalPrompt() {
	return (
		<>
			
		</>
	)
}

export function ModuleEdge({nextModulePath, currentWorkshopPath, remainingModules, moduleFinished}) {
	return (
		<>
			{moduleFinished ? (
                <div className="EdgeBox">
                    <Heading1 text="Module Complete!" style={{gridColumn: "1 / -1", gridRow: "1"}}/>
                    <Heading2 text={`${remainingModules} module${remainingModules !== 1 ? 's' : ''} left to RSVP.`} style={{ gridColumn: "1 / -1", gridRow: "2" }} />
                    <NextButton to={nextModulePath} text="Next" style={{gridColumn: "1", gridRow: "3"}}/>
                    <NextButton to={currentWorkshopPath} text="Leave" style={{gridColumn: "2", gridRow: "3"}}/>
			    </div>
            ) : (
                <div className="EdgeBox">
                    <Heading1 text="Module Complete!" style={{gridColumn: "1 / -1", gridRow: "1"}}/>
                    <Heading2 text={"Your RSVP is ready."} style={{ gridColumn: "1 / -1", gridRow: "2" }} />
                    {/* <NextButton to={} text="RSVP" style={{gridColumn: "1", gridRow: "3"}}/> */}
                    <NextButton to={currentWorkshopPath} text="Leave" style={{gridColumn: "2", gridRow: "3"}}/>
			    </div>
            )}
		</>
	)
}
