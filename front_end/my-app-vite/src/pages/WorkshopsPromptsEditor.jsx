import React, {
    useState,
    useEffect,
    useRef,
    useContext
} from "react";
  
import axios from "axios";

import {
    useParams,
    useLocation
} from "react-router-dom";

import { EditorSubmitContext } from "../context/EditorSubmitContext.jsx";

import {
    CreateMultipleChoiceTemplate,
    CreateCheckListTemplate,
    CreateShortResponseTemplate,
    CreateDragAndDropTemplate,
    CreateSampleRaterTemplate,
    CreateScriptNotationTemplate,
    CreateDropDownTemplate
} from "../CreateForms.jsx";

import { PromptInstruction } from "../Headings.jsx";
import { DropDown, ModuleNavigator } from "../Buttons.jsx";
import { useOverlay } from "../context/OverlayContext.jsx";
import { ErrorOverlay } from "../components/ErrorOverlay.jsx";
import { classifyError } from "../errors/errorRegistry.js";

export function WorkshopPromptsEditor() {
    
    const { workshopId, moduleId } = useParams();

    const accessToken = localStorage.getItem('accessToken');
    
    const promptsRef = useRef([]);
    const [promptIndex, setPromptIndex] = useState(0);
    const [promptsList, setPromptsList] = useState([]);
    const [formData, setFormData] = useState({});
    const [dropDownReset, setDropDownReset] = useState(false);
    const location = useLocation();
    const { moduleName } = location.state || {};
    const setSubmitHandler = useContext(EditorSubmitContext);
    const [submissionSuccess, setSubmissionSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { show } = useOverlay();

    useEffect(() => {
    	setSubmitHandler(() => handleSubmit);
    	return () => setSubmitHandler(null);
    },[]);    

    const handleSubmit = async () => {
        setIsSubmitting(true);
        console.log(promptsRef.current);
        try {
            const responseAddPrompts = await axios.post(
                `${import.meta.env.VITE_API_URL}/workshops/${workshopId}/modules/${moduleId}/prompts`,
                { promptDataList: promptsRef.current },
                {headers: {'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`}}
            );
            const responseUpdateStatus = await axios.put(
                `${import.meta.env.VITE_API_URL}/workshops/${workshopId}/modules/${moduleId}`,
                { newStatus: 'open' },
                {headers: {'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`}}
            );
            setSubmissionSuccess(true);
        } catch (error) {
            const classification = classifyError(error, { hint: "PROMPTS_SAVE_FAILED" });
            show(<ErrorOverlay classification={classification} />);
            console.error(error);
        } finally {
            setIsSubmitting(false)
        }
    }

    // const handleSubmit = async (event) => {
    //     event.preventDefault();
        
    //     try {
    //         const response = await axios.post(`${import.meta.env.VITE_API_URL}/users/login`,
    //         { email: email, password: password },
    //         { headers: {'Content-Type': 'application/json'}});
    //         console.log(`Log In Response: ${JSON.stringify(response.data)}`);
    //         localStorage.setItem('accessToken', response.data.accessToken);
    //     } catch (error) {
    //         console.log(`Server Error: ${error}`);
    //     }
        
    //     console.log(`Email: ${email}`);
    //     console.log(`Password: ${password}`);
    // }

    const handleTemplateSelect = (templateName) => {
        const templateMap = {
            'Multiple Choice': 1,
            'Checklist': 3,
            'Short Response': 4,
            'Drag and Drop': 6,
            'Sample Rater': 7,
            'Notation': 8,
            'DropDown': 9,
        };
    
        const templateId = templateMap[templateName];
        if (!templateId) return;
    
        const newPromptStructure = (() => {
            switch (templateId) {
                case 1:
                    return { multipleChoicePrompts: [{ questionText: '', options: [''] }]}
                case 3:
                    return { checkListPrompts: [{ questionText: '', options: [''] }]}
                case 9:
                    return { dropDownPrompts: [{ questionText: '', options: [''] }]};
                case 4:
                    return { questions: [{ questionText: '' }]};
                case 7:
                    return { referenceText: '' };
                case 8:
                    return { referenceText: '' };
                case 6:
                    return { options: [{ optionName: '' }]};
            }
        })();
    
        const updatedList = [...promptsList];
        updatedList[promptIndex] = {
            prompt_template_id: templateId,
            formData: newPromptStructure
        };
    
        setPromptsList(updatedList);

	    promptsRef.current = updatedList;
    };

        const handleNext = () => {
            if (!promptsList[promptIndex]) {
                alert("Please select a template before proceeding.");
                return;
            }
            setPromptIndex((prevIndex) => prevIndex + 1);
	    setDropDownReset(prev => !prev);	
        };
    
        const handleBack = () => {
            setPromptIndex((prevIndex) => prevIndex - 1);
        }
    
        const isFirst = promptIndex === 0;
        
        const renderPromptTemplate = () => {
            const prompt = promptsList[promptIndex];
    
            if (!prompt) {
                return <div>Please choose a template to begin.</div>;
            }
    
            // switch case to render different templates based on prompt_template_id
            switch (prompt.prompt_template_id) {
                case 1:
                    return <CreateMultipleChoiceTemplate 
                        onChange={(updated) => {
                            const updatedList = [...promptsList];
                            updatedList[promptIndex] = {
                                ...updatedList[promptIndex],
                                prompt_template_id: 1,
                                formData: updated
                            };
                            setPromptsList(updatedList);
        		    promptsRef.current = updatedList;
                        }}
                        savedData={promptsList[promptIndex]?.formData}
                    />;
                case 3:
                    return <CreateCheckListTemplate
                        onChange={(updated) => {
                            const updatedList = [...promptsList];
                            updatedList[promptIndex] = {
                                ...updatedList[promptIndex],
                                prompt_template_id: 3,
                                formData: updated
                            };
                            setPromptsList(updatedList);
                            promptsRef.current = updatedList;
                        }}
                        savedData={promptsList[promptIndex]?.formData}
                    />;
                case 4:
                    return <CreateShortResponseTemplate 
                        onChange={(updated) => {
                            const updatedList = [...promptsList];
                            updatedList[promptIndex] = {
                                ...updatedList[promptIndex],
                                prompt_template_id: 4,
                                formData: updated
                            };
                            setPromptsList(updatedList);
                            promptsRef.current = updatedList;
                        }}
                        savedData={promptsList[promptIndex]?.formData}
                    />;
                case 6:
                    return <CreateDragAndDropTemplate 
                        onChange={(updated) => {
                            const updatedList = [...promptsList];
                            updatedList[promptIndex] = {
                                ...updatedList[promptIndex],
                                prompt_template_id: 6,
                                formData: updated
                            };
                            setPromptsList(updatedList);
                            promptsRef.current = updatedList;
                        }}
                        savedData={promptsList[promptIndex]?.formData}
                    />;
                case 7:
                    return <CreateSampleRaterTemplate  
                        onChange={(updated) => {
                            const updatedList = [...promptsList];
                            updatedList[promptIndex] = {
                                ...updatedList[promptIndex],
                                prompt_template_id: 7,
                                formData: updated
                            };
                            setPromptsList(updatedList);
                            promptsRef.current = updatedList;
                        }}
                        savedData={promptsList[promptIndex]?.formData}
                    />;
                case 8:
                    return <CreateScriptNotationTemplate  
                        onChange={(updated) => {
                            const updatedList = [...promptsList];
                            updatedList[promptIndex] = {
                                ...updatedList[promptIndex],
                                prompt_template_id: 8,
                                formData: updated
                            };
                            setPromptsList(updatedList);
                            promptsRef.current = updatedList;
                        }}
                        savedData={promptsList[promptIndex]?.formData}
                    />;
                case 9:
                    return <CreateDropDownTemplate  
                        onChange={(updated) => {
                            const updatedList = [...promptsList];
                            updatedList[promptIndex] = {
                                ...updatedList[promptIndex],
                                prompt_template_id: 9,
                                formData: updated
                            };
                            setPromptsList(updatedList);
                            promptsRef.current = updatedList;
                        }}
                        savedData={promptsList[promptIndex]?.formData}
                    />;
                default:
                    return <div>Unknown Template</div>;
            }
        }

        if (submissionSuccess) {
            return (
                <>
                    <div>Prompts added and module is now open!</div>
                </>
            )
        }
    
        return (
            <>
                {isSubmitting && <div>Submitting...</div>}
                <PromptInstruction question={`Editing Module: ${moduleName}`}/>
                <DropDown reset={dropDownReset} onSelect={handleTemplateSelect} options={['Multiple Choice','Checklist','Short Response','Drag and Drop','Sample Rater','Notation','DropDown']}/>
                { promptsList[promptIndex] && renderPromptTemplate() }
                <ModuleNavigator backActive={isFirst} backClick={handleBack} nextClick={handleNext}/>
            </>
        )
}