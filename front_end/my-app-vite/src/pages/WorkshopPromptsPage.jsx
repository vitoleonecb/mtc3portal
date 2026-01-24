import React, {
    useState,
    useEffect,
    useContext
  } from "react";
  
import { useParams, useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { jwtDecode } from "jwt-decode";;

import {
    MultipleChoiceTemplate,
    CheckListTemplate,
    ShortResponseTemplate,
    DragAndDropTemplate,
    SampleRaterTemplate,
    ScriptNotationTemplate,
    DropDownTemplate,
} from "../Templates.jsx";

import { ProgressContext } from '../context/ProgressContext.jsx'

import { ResponseProcessor } from "../Processing.jsx";
import { ModuleNavigator } from "../Buttons.jsx";
import { ModuleEdge } from "../EdgePages.jsx";

import { Heading1 } from "../Headings.jsx";

export function WorkshopPromptsPage() {
    const { workshopId, moduleId, promptId } = useParams();
    const accessToken = localStorage.getItem('accessToken');
    let decodedToken = null;

    if (typeof accessToken === "string" && accessToken.trim() !== "") {
        try {
            decodedToken = jwtDecode(accessToken);
        } catch (err) {
            console.error("Invalid token:", err);
            decodedToken = null;
        }
    }
    const userId = decodedToken?.user_id;
    const [isAdmin, setIsAdmin] = useState(false);
    const [allResponses, setAllResponses] = useState(null);
    const [RSVPStatus, setRSVPStatus] = useState(undefined);
    const [promptsList, setPromptsList] = useState([]);
    const [remainingModules, setRemainingModules] = useState(0);
    const [promptIndex, setPromptIndex] = useState(0);
    const [promptMode, setPromptMode] = useState('edit');
    const [RSVPEarned, setRSVPEarned] = useState(false);
    const [nextModulePath, setNextModulePath] = useState(null);
    const [responseData, setResponseData] = useState([]);
    const [endOfPrompts, setEndOfPrompts] = useState(false);
    const [moduleComplete, setModuleComplete] = useState(false);
    const [RSVPPath, setRSVPPath] = useState(null);
    const [formData, setFormData] = useState();
    const navigate = useNavigate();
    const location = useLocation();
    const { state: progressState, setState: setProgressState, moduleStatus, setModuleStatus } = useContext(ProgressContext);

    useEffect(() => {
        if (location.state?.moduleStatus) {
          setModuleStatus(location.state.moduleStatus);
        }
      }, []);

    useEffect(() => {
        const fetchRSVPStatus = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/workshops/${workshopId}/rsvp/${userId}/status`, { 
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                response.data.length === 1 ? setRSVPStatus(true) : setRSVPStatus(false);

                console.log(`RSVP Status: ${response.data.length === 1 ? 'YES RSVP':'NO RSVP'}`)
            } catch (error) {
                console.log(`Front End Fetch Error: ${error}`);
            }
        }
        fetchRSVPStatus()
    },[])

    useEffect(() => {
        const fetchPromptInformation = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/workshops/${workshopId}/modules/${moduleId}/prompts`, { 
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${accessToken}`
                    }
                });

                const parsedData = response.data.map(p => ({
                    ...p,
                    workshop_prompt_options:
                        typeof p.workshop_prompt_options === 'string'
                            ? JSON.parse(p.workshop_prompt_options)
                            : p.workshop_prompt_options
                }));

                console.log(JSON.stringify(parsedData));

                setPromptsList(parsedData);
                const index = parsedData.findIndex(p => p.workshop_prompt_id == promptId);
                setPromptIndex(index >= 0 ? index : 0);
            } catch (error) {
                console.log(`Front End Fetch Error: ${error}`);
            }
        }

        fetchPromptInformation();
    }, [workshopId, moduleId, accessToken]);

    useEffect(() => {
        if (promptsList.length === 0) return;
        const index = promptsList.findIndex(p => p.workshop_prompt_id == promptId);
        setPromptIndex(index >= 0 ? index : 0);
    }, [promptId, promptsList]);

    useEffect(() => {
        const fetchAdminStatus = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/users/${userId}/isadmin`,{
                    headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${accessToken}`
                                }
                });
                response.data > 0 && setIsAdmin(true);
            } catch (error) {
                console.log(`Server Error: ${error}`);
            }
        };
        fetchAdminStatus();
    },[userId]);

    useEffect(() => {
        if (promptsList[promptIndex]?.prompt_template_id === 3) {
            const checkListPrompts = promptsList[promptIndex].workshop_prompt_options.checkListPrompts;
    
            const initialResponse = checkListPrompts.map(q => ({
                questionText: q.questionText,
                options: q.options.map(opt => ({
                    optionText: opt,
                    selected: false
                }))
            }));
    
            setResponseData(initialResponse);
        }
    }, [promptsList, promptIndex]);

    useEffect(() => {
        const fetchProgress = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/workshops/modules/${moduleId}/progress`,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${accessToken}`
                        }
                    }
                );
                setProgressState({ current: response.data.count, max: promptsList.length });
            } catch (error) {
                console.error('Failed to fetch progress:', error);
            }
        };
    
        fetchProgress();
    }, [promptIndex, promptsList.length]);

    useEffect(() => {
        if (promptsList.length > 0 && progressState?.current != null) {
            setModuleComplete(progressState.current === promptsList.length);
        }
    }, [promptsList.length, progressState]);

    useEffect(() => {
        const p = promptsList[promptIndex];
        if (!p) return;
        switch (p.prompt_template_id) {
          case 1: // MC
          case 4: // short
          case 9: // dropdown
            setResponseData([]); break;
          case 3: { // checklist -> build skeleton from options
            const cl = p.workshop_prompt_options?.checkListPrompts ?? [];
            const init = cl.map(q => ({
              questionText: q.questionText,
              options: (q.options || []).map((opt, i) => ({ id:i, optionText: opt, selected:false }))
            }));
            setResponseData(init);
            break;
          }
          case 6: setResponseData({}); break;                // DnD uses map
          case 7: setResponseData({ rating: '' }); break;
          case 8: setResponseData({ notationResponse: '' }); break;
          default: setResponseData([]);
        }
      }, [promptsList, promptIndex]);

    useEffect(() => {
        
        const fetchResponse = async () => {
            
            if (!promptId) return;
            if (RSVPStatus === undefined) return;
            if (moduleStatus === 'processing') {
                setPromptMode('view');
            }

            try {
                const me = await axios.get(
                    `${import.meta.env.VITE_API_URL}/workshops/prompts/${promptId}/response`,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${accessToken}`
                        }
                    }
                )

                if (isAdmin || RSVPStatus) {

                    const allResponsesResponse = await axios.get(
                        `${import.meta.env.VITE_API_URL}/workshops/${workshopId}/modules/${moduleId}/prompts/${promptId}`,
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${accessToken}`
                            }
                        }
                    )

                    setAllResponses(allResponsesResponse.data);
		            console.log(allResponsesResponse.data);
                }

                if (me.data?.response) {
                    const parsed = typeof me.data.response === 'string'
                    ? JSON.parse(me.data.response)
                    : me.data.response;
                    setPromptMode('view');         
                    setResponseData(parsed);
                } else {
                    setPromptMode('edit');
                    setResponseData([]);
		        }
            } catch (error) {
                console.log(`Front End Error: ${error}`);
                setPromptMode('edit');
                setResponseData([]);
            }
        }

        fetchResponse();
    }, [promptId, isAdmin, accessToken, workshopId, moduleId, RSVPStatus]);

    //Debugging Next Button Persistence BEGIN

    useEffect(() => {
        setEndOfPrompts(false);
        setRSVPEarned(false);
        setNextModulePath(null);
    }, [workshopId, moduleId, promptId]);

      //Debugging Next Button Persistence END

	useEffect(() => {
		console.log('responseData changed: ', responseData);
	}, [responseData]);

    const handleResponseChange = (
        index = 0,
        questionText = '',
        value = '',
        selected = false,
        keyName = '',
        meta = undefined
        ) => {

            const currentTemplateId = promptsList[promptIndex]?.prompt_template_id;

            switch (currentTemplateId) {
                case 1: { // multiple choice
                    setResponseData(prev => {
                      const updated = Array.isArray(prev) ? [...prev] : [];
                      updated[index] = { questionText, optionId: value, optionLabel: keyName };
                      return updated;
                    });
                    break;
                  }

                case 3: {
                    const optionId = value;        // j
                    const optionLabel = keyName;   // label

                    setResponseData(prev => {
                        const updated = Array.isArray(prev) ? [...prev] : [];
                        const existing = updated[index] ?? { questionText, options: [] };
                        const opts = Array.isArray(existing.options) ? [...existing.options] : [];

                        // ensure dense options array
                        while (opts.length <= optionId) {
                            opts.push({ id: opts.length, optionText: '', selected: false });
                        }

                        opts[optionId] = {
                            id: optionId,
                            optionText: optionLabel,
                            selected: !!selected,
                        };

                        updated[index] = { ...existing, questionText, options: opts };
                        return updated;
                    });
                    break;
                }

                case 4: { // another short/long answer
                    setResponseData(prev => {
                        const updated = Array.isArray(prev) ? [...prev] : [];
                        updated[index] = { questionText, answer: value };
                        return updated;
                    });
                    break;
                }

                case 6: {
                    // Drag-and-drop now stores normalized position plus semantics
                    setResponseData(prev => {
                        const updated = Array.isArray(prev) ? [...prev] : [];
                        const base = {
                            index,
                            keyName,
                            position: value,
                        };
                        const extras = meta && typeof meta === 'object' ? meta : {};
                        updated[index] = { ...base, ...extras };
                        return updated;
                    });
                    break;
                }

                case 7: { // rating (object shape)
                    setResponseData(prev => {
                        const updated = { ...(prev || {}) };
                        updated.rating = value;
                        return updated;
                    });
                    break;
                }

                case 8: { // notation text (object shape)
                    setResponseData(prev => {
                        const updated = { ...(prev || {}) };
                        updated.notationResponse = value;
                        return updated;
                    });
                    break;
                }

                case 9: { // another indexed answer
                    setResponseData(prev => {
                        const updated = Array.isArray(prev) ? [...prev] : [];
                        updated[index] = { questionText, answer: keyName, optionId: value, optionLabel: keyName };
                        return updated;
                    });
                    break;
                }

                default:
                    console.warn('Unknown Template ID:', currentTemplateId);
            }
        };

    const isEmptyResponse = (d) => {
        if (d == null) return true;
        if (Array.isArray(d)) return d.length === 0;
        if (typeof d === 'object') return Object.keys(d).length === 0;
        return false;
    };

    const handleSubmit = async () => {
        if (promptMode === 'view') return false;
        try {
          if (isEmptyResponse(responseData)) {
            console.log('Nothing to submit');
            return false;
          }
          const p = promptsList[promptIndex];
          const res = await axios.post(
            `${import.meta.env.VITE_API_URL}/workshops/${workshopId}/modules/${moduleId}/prompts/${promptId}/response`,
            { workshop_response_content: responseData, prompt_template_id: p.prompt_template_id },
            { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${accessToken}` } }
          );
          if (res.status === 200 || res.status === 201) {
            setPromptMode('view');
            // setProgressState(prev => ({ current: prev.current + 1, max: prev.max }));
            if (promptIndex === promptsList.length - 1) {
                await handleEndOfModule();
                setEndOfPrompts(true); 
            } else {
                setEndOfPrompts(false);
            }
          }
          console.warn(`Unexpected status code: ${res.status}`);
          return false;
        } catch (e) {
          console.error(`Submission Failed: ${e}`);
          return false;
        }
      };

     const handleEndOfModule = async () => {
             try {
                 const progressRes = await axios.get(`${import.meta.env.VITE_API_URL}/workshops/${workshopId}/modulesprogress`, {
                     headers: { 'Authorization': `Bearer ${accessToken}` }
                 });
        
                 const progressData = progressRes.data;

                 // Diagnosing Next Button Issue BEGIN

                 console.table(progressData.map(p => ({
                    module_id: p.module_id, type: typeof p.module_id,
                    prompt_count: p.prompt_count, response_count: p.response_count
                  })));

                  // Diagnosing Next Button Issue END
        
                 const unfinished = progressData.find(
                     ({ prompt_count, response_count }) => response_count < prompt_count
                 );
        
                 const unfinishedcount = progressData.filter(
                     ({ prompt_count, response_count }) => response_count < prompt_count
                 );
        
                 setRemainingModules(unfinishedcount.length);
        
                 if (unfinished) {
                     const modules = await axios.get(`${import.meta.env.VITE_API_URL}/workshops/${workshopId}/modules`, {
                         headers: {
                             'Content-Type': 'application/json',
                             'Authorization': `Bearer ${accessToken}`
                         }
                     });
        
                     const moduleData = modules.data;
                     const moduleMatch = moduleData.find(mod => String(mod.workshop_module_id) === String(unfinished.module_id));
        
                     if (moduleMatch?.first_prompt_id) {
                         setNextModulePath(`/workshops/${workshopId}/modules/${moduleMatch.workshop_module_id}/prompts/${moduleMatch.first_prompt_id}`);
                     }
                 } else {
                    try {
                        const rsvpCreate = await axios.post(
                            `${import.meta.env.VITE_API_URL}/workshops/rsvp/create`,
                            {user_id: userId, workshop_id: workshopId},
                            { headers: {'Content-Type':'application/json', 'Authorization': `Bearer ${accessToken}`}}
                        );
                    } catch (error) {
                        console.error(`Front End Error: ${error}`);
                    }
                    setNextModulePath(null);
                    setRSVPPath(`/workshops/${workshopId}/rsvp/${userId}`);
                    console.log(RSVPPath);
                    setRSVPEarned(true);
                    setEndOfPrompts(true)
                }
             } catch (error) {
                 console.log(`Server Error during RSVP check: ${error}`);
             }
         };
        

         const handleNext = () => {
            if (promptIndex < promptsList.length - 1) {
              const nextPromptId = promptsList[promptIndex + 1].workshop_prompt_id;
              navigate(`/workshops/${workshopId}/modules/${moduleId}/prompts/${nextPromptId}`);
            } else {
              setEndOfPrompts(true);
            }
          };

    const handleBack = () => {
        const prevPromptId = promptsList[promptIndex - 1].workshop_prompt_id;
        navigate(`/workshops/${workshopId}/modules/${moduleId}/prompts/${prevPromptId}`);
    };

    const prompt = promptsList[promptIndex];
    const instructionNeeded = [4, 6].includes(prompt?.prompt_template_id);

    const renderPrompt = () => {
        if (!prompt) return <div>Loading...</div>;

        switch (prompt.prompt_template_id) {
            case 1:
                return <MultipleChoiceTemplate responseData={responseData} disabled={promptMode === 'view'} onUpdateResponse={handleResponseChange} multipleChoiceOptions={prompt.workshop_prompt_options} />;
            case 3:
                return <CheckListTemplate  responseData={responseData} disabled={promptMode === 'view'} onUpdateResponse={handleResponseChange} checkListOptions={prompt.workshop_prompt_options} />;
            case 4:
                return <ShortResponseTemplate  responseData={responseData} disabled={promptMode === 'view'} onUpdateResponse={handleResponseChange} shortResponseOptions={prompt.workshop_prompt_options} />;
            case 6:
                return <DragAndDropTemplate  responseData={responseData} disabled={promptMode === 'view'} onInitialPositions={setResponseData} onUpdateResponse={handleResponseChange} dragOptions={prompt.workshop_prompt_options} />;
            case 7:
                return <SampleRaterTemplate  responseData={responseData} disabled={promptMode === 'view'} onUpdateResponse={handleResponseChange} reference={prompt.workshop_prompt_reference} />;
            case 8:
                return <ScriptNotationTemplate  responseData={responseData} disabled={promptMode === 'view'} onUpdateResponse={handleResponseChange} reference={prompt.workshop_prompt_reference} />;
            case 9:
                return <DropDownTemplate  responseData={responseData} disabled={promptMode === 'view'} onUpdateResponse={handleResponseChange} dropDownOptions={prompt.workshop_prompt_options} />;
            default:
                return <div>Unknown Template</div>;
        }
    };

    const renderResponses = () => {
        if (!prompt) return <div>Loading...</div>;
            return <ResponseProcessor promptId={promptId} allResponses={allResponses} isAdmin={isAdmin} templateId={prompt.prompt_template_id}/>;
        }

    console.log(`Prompt Mode: ${promptMode}`);

    const isFirst = promptIndex === 0;

    if (endOfPrompts) {
        return (
            <>
                <ModuleEdge 
                    currentWorkshopPath={`/workshops/${workshopId}/modules`}
                    nextModulePath={nextModulePath}
                    remainingModules={remainingModules}
                    RSVPEarned={RSVPEarned}
                    RSVPPath={`/workshops/${workshopId}/rsvp/${userId}`}
                />
            </>
        )
    }

    console.log(`All Responses Response: ${JSON.stringify(allResponses, null, 2)}`);
    console.log(`isAdmin: ${isAdmin}`)

    return (
        <>
            {instructionNeeded && (
                <Heading1 text={prompt.prompt_template_id === 4 ? 'Free Response' : 'Drag and Drop'} />
            )}

            {renderPrompt()}

            {(isAdmin || RSVPStatus) && Array.isArray(allResponses) && allResponses.length > 0 && (
                <>
                    {renderResponses()}
                </>
            )}

            <ModuleNavigator
                submitHandler={handleSubmit}
                backActive={isFirst}
                backClick={handleBack}
                nextClick={handleNext}
                isReader={true}
		        promptMode={promptMode}
		        endOfPrompts={endOfPrompts}
            />
        </>
    );
};