import { MenuBarIcon, DragAndDropKey, ProgressBar } from './Icons.js';
import { ModuleEdge } from './EdgePages.js';
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
import { ResponseProcessor } from './Processing.js'
import { jwtDecode } from 'jwt-decode';
import { Link, useParams, useNavigate, Outlet, useLocation, useMatch } from 'react-router-dom';
import { format } from 'date-fns';
import { EditorSubmitContext } from './EditorSubmitContext';
import { MysqlDateInput } from './DateInput.js'

import {
    CreateCheckListTemplate,
    CreateMultipleChoiceTemplate,
    CreateShortResponseTemplate,
    CreateDragAndDropTemplate,
    CreateSampleRaterTemplate,
    CreateScriptNotationTemplate,
    CreateDropDownTemplate
  } from './CreateForms';

export const ProgressContext = createContext({
    state: { current: 0, max: 0 },
    setState: () => {}
});

export function ProgressProvider({ children }) {
    const [state, setState] = useState({ current: 0, max: 0 });
    const [moduleStatus, setModuleStatus] = useState(null);
  
    return (
      <ProgressContext.Provider value={{ state, setState, moduleStatus, setModuleStatus }}>
        {children}
      </ProgressContext.Provider>
    );
  }

export function DocumentationPage() {
    return (
        <>
        </>
    );
}

export function WorkshopsPage() {
    
    const [workshopsList, setWorkshopsList] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const [createFormSelected, setCreateFormSelected] = useState(false);
    const [date, setDate] = useState('');
    const [currentStep, setCurrentStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState("");

    // State for POST via API

    const [workshopCreateForm, setWorkshopCreateForm] = useState({
        workshopName : '',
        workshopDescription : '',
        workshopTime : '',
        workshopLocation : '',
        workshopStyle : ''
    });

    const accessToken = localStorage.getItem('accessToken');
    const decodedToken = jwtDecode(accessToken);
    const userId = decodedToken.user_id;

    useEffect(() => {
        const fetchWorkshops = async () => {
            try {
                const workshopsResponse = await axios.get(`${process.env.REACT_APP_API_BASE}/workshops`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization' : `Bearer ${accessToken}`
                }
            });
            console.log(`Workshops Recieved: ${JSON.stringify(workshopsResponse.data)}`);
            setWorkshopsList(workshopsResponse.data)
        
            } catch(error) {
                console.log(error);
            }
        };

        fetchWorkshops();
    }, []);

    useEffect(() => {
        const fetchAdminStatus = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_BASE}/users/${userId}/isadmin`,{
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

    const formatDate = (datetime) => {

        const dateTimeObject = new Date(datetime);

        const formattedDate = format(dateTimeObject, "EEEE 'at' h:mm a | MM-dd-yyyy")
        
        return formattedDate;
    };

    const handleClick = () => {

        setCreateFormSelected(true);
        
    }

    function handleFieldChange(e) {
        const { name, value } = e.target;
        setWorkshopCreateForm(prev => ({ ...prev, [name]: value }));
      }

    function handleDateChange(nextValue) {
        setWorkshopCreateForm(prev => ({ ...prev, workshopTime: nextValue }));
      }

    function handleStyleSelect(option) {
        setWorkshopCreateForm(prev => ({ ...prev, workshopStyle: option }));
      }
    
    function isStepValid(stepIndex) {
        switch (stepIndex) {
            case 0: return workshopCreateForm.workshopName.trim().length > 0;
            case 1: return workshopCreateForm.workshopDescription.trim().length > 0;
            case 2: return workshopCreateForm.workshopTime?.trim().length > 0;
            case 3: return workshopCreateForm.workshopLocation.trim().length > 0;
            case 4: return workshopCreateForm.workshopStyle.trim().length > 0;
            default: return true;
        }
    }

    function next() {
        if (!isStepValid(currentStep)) return;
            setCurrentStep(s => Math.min(s + 1, 4));
      }
    
    function back() {
        setCurrentStep(s => Math.max(s - 1, 0));
    }

    async function createWorkshop() {
        if (!isStepValid(currentStep)) return;
      
        setSubmitting(true);
        setErrorMsg("");
      
        try {
          // Map camelCase → API snake_case (adjust endpoint & payload names to match your server)
          const payload = {
            workshop_name: workshopCreateForm.workshopName,
            workshop_description: workshopCreateForm.workshopDescription,
            workshop_date: workshopCreateForm.workshopTime,        // ISO string or "YYYY-MM-DD HH:mm:ss"
            workshop_location: workshopCreateForm.workshopLocation,
            workshop_public: workshopCreateForm.workshopStyle === 'public' ? 1 : 0
          };
      
          await axios.post(
            `${process.env.REACT_APP_API_BASE}/workshops`,
            payload,
            { headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` } }
          );
      
          // refresh list
          const workshopsResponse = await axios.get(`${process.env.REACT_APP_API_BASE}/workshops`, {
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` }
          });
          setWorkshopsList(workshopsResponse.data);
      
          // reset and close
          setWorkshopCreateForm({
            workshopName : "",
            workshopDescription : "",
            workshopTime : "",
            workshopLocation : "",
            workshopStyle : ""
          });
          setCurrentStep(0);
          setCreateFormSelected(false);
        } catch (err) {
          const msg = err.response?.data?.message || err.message || "Failed to create workshop";
          setErrorMsg(msg);
        } finally {
          setSubmitting(false);
        }
      }
      
      // Helper to show preview date nicely (fallback "—")
      function previewDate(d) {
        if (!d) return "—";
        const dt = new Date(d);
        if (Number.isNaN(+dt)) return d; // show raw if not parseable
        return format(dt, "EEEE 'at' h:mm a | MM-dd-yyyy");
      }
    
    return (
        <>
            
            <Heading1 text="Workshops" />
            {workshopsList.map((workshop) => (
                <Link to={`/workshops/${workshop.workshop_id}/modules`} className="linkNoUnderLine cardLink">
                    <WorkshopCard
                            key={workshop.workshop_id}
                            workshopName={workshop.workshop_name} 
                            workshopDescription={workshop.workshop_description} 
                            workshopDate={formatDate(workshop.workshop_date)} 
                            workshopLocation={workshop.workshop_location}
                        />
                </Link>))
            }

            {isAdmin && <CreateButton handleClick={handleClick}/>}

            {createFormSelected && (
                <>
            
                {/* Slide content */}
                {currentStep === 0 && (
                  <>
                    <Heading2 text="Name it" />
                    <input
                      type="text"
                      name="workshopName"
                      value={workshopCreateForm.workshopName}
                      onChange={handleFieldChange}
                      className="textInput"
                      maxLength={60}
                      placeholder="e.g., Movement Lab: Breath & Balance"
                      autoFocus
                    />
                  </>
                )}
            
                {currentStep === 1 && (
                  <>
                    <Heading2 text="Describe it" />
                    <textarea
                      name="workshopDescription"
                      value={workshopCreateForm.workshopDescription}
                      onChange={handleFieldChange}
                      className="OpenResponse"
                      placeholder="What happens in this workshop? Who is it for?"
                      rows={5}
                    />
                  </>
                )}
            
                {currentStep === 2 && (
                  <>
                    <Heading2 text="When?" />
                    {/* Expect MysqlDateInput to call onChange(value) */}
                    <MysqlDateInput
                      value={workshopCreateForm.workshopTime}
                      onChange={handleDateChange}
                    />
                  </>
                )}
            
                {currentStep === 3 && (
                  <>
                    <Heading2 text="Where?" />
                    <input
                      type="text"
                      name="workshopLocation"
                      value={workshopCreateForm.workshopLocation}
                      onChange={handleFieldChange}
                      className="textInput"
                      maxLength={80}
                      placeholder="Studio / Venue / Address"
                    />
                  </>
                )}
            
                {currentStep === 4 && (
                  <>
                    <Heading2 text="Style" />
                    <DropDown
                      reset={false}
                      onSelect={handleStyleSelect}
                      options={["Public", "Private"]}
                    />
                  </>
                )}
            
                {/* Nav buttons */}
                <div className="createWorkshopButtonContainer">
                  <button type="button" onClick={back} className="createButton" disabled={currentStep === 0}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <polyline points="12.75 2.75 5.25 9 12.75 15.25" stroke="black" fill="none" />
                    </svg>
                  </button>
                  {currentStep < 4 ? (
                    <button type="button" onClick={next} className="createButton" disabled={!isStepValid(currentStep)}>
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <polyline points="5.25 2.75 12.75 9 5.25 15.25" stroke="black" fill="none" />
                        </svg>

                    </button>
                  ) : (
                    <button
                      type="button"
                      className="createButton"
                      onClick={createWorkshop}
                      disabled={submitting || !isStepValid(4)}
                    >
                        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <polyline points="3.25 9.5 7.5 14.5 14.75 3.25" stroke="black" fill="none" />
                        </svg>
                    </button>
                  )}
                </div>
            
                {errorMsg && <p style={{ color: "crimson" }}>{errorMsg}</p>}
            
                {/* Live preview card */}
                <div style={{ marginTop: 24 }}>
                  <WorkshopCard
                    workshopName={workshopCreateForm.workshopName || "—"}
                    workshopDescription={workshopCreateForm.workshopDescription || "—"}
                    workshopDate={previewDate(workshopCreateForm.workshopTime)}
                    workshopLocation={workshopCreateForm.workshopLocation || "—"}
                  />
                </div>
              </>
            )}
        </>
        
    )
}

export function LogInPage() {
    
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const navigate = useNavigate();

    const handlePasswordChange = (event) => {
        setPassword(event.target.value);
    }

    const handleEmailChange = (event) => {
        setEmail(event.target.value);
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_BASE}/users/login`,
            { email: email, password: password },
            { headers: {'Content-Type': 'application/json'}});
            console.log(`Log In Response: ${JSON.stringify(response.data)}`);
            localStorage.setItem('accessToken', response.data.accessToken);
	    navigate('/workshops');
        } catch (error) {
            console.log(`Server Error: ${error}`);
        }
        
        
    }

    return (
        <>
            <Heading1 text="Log In" style={{ textAlign: "center" }}/>
            <form className="logInForm" onSubmit={handleSubmit}>
                <Heading2 text="Email"/>
                <input onChange={handleEmailChange} value={email} className="textInput" type="email">
                </input>
                <Heading2 text="Password"/>
                <input onChange={handlePasswordChange} value={password} className="passwordInput" type="password">
                </input>
	        <LogInButton />
            </form>    
        </>
    )
}

export function WorkshopCreateForm() {

    const steps = [
        { key: 'workshopName', label: 'What\'s the name of the Workshop?' },
        { key: 'workshopDescription', label: 'What are we doing?' },
        { key: 'workshopDate', label: 'When? (YYYY-MM-DD)' },
        { key: 'workshopLocation', label: 'Where?' },
        { key: 'workshopPublic', label: 'Is it happening in public?' }
    ];

    const [stepIndex, setStepIndex] = useState(0);
    const [workshopForm, setWorkshopForm] = useState({
        workshopName: '',
        workshopDescription: '',
        workshopDate: '',
        workshopLocation: '',
        workshopPublic: 0
    });

    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async () => {
        try {
            
            const accessToken = localStorage.getItem('accessToken');

            console.log(accessToken);

            console.log(workshopForm);
            
            const response = await axios.post(`${process.env.REACT_APP_API_BASE}/workshops`,
            { 
                workshop_name: workshopForm['workshopName'], 
                workshop_description: workshopForm['workshopDescription'], 
                workshop_location: workshopForm['workshopLocation'], 
                workshop_date: workshopForm['workshopDate'],
                workshop_public: workshopForm['workshopPublic']
            },
            { headers: {'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`} }
            );
            console.log(response.data);
            setSubmitted(true);
        } catch (error) {
            console.log(`Internal Server Error ${error}`)
        }
    }

    const handleNext = () => {
        if (stepIndex < steps.length - 1) {
            setStepIndex(stepIndex + 1);
        } else {
            handleSubmit();
            console.log(`Workshop Created: ${workshopForm['workshopName']}`);
        }
    }
    const handleChange = (event) => {
        setWorkshopForm({...workshopForm, [steps[stepIndex].key]: event.target.value})
    }

    const handleYesClick = () => {
        setWorkshopForm({...workshopForm, [steps[stepIndex].key]: 1})
    }

    useEffect(() => {
        if (workshopForm['workshopPublic'] === 1) {
            handleSubmit();
            console.log(`Workshop Created: ${workshopForm['workshopName']}`);
        }
    }, [workshopForm['workshopPublic']]);

    const isPublicKey = steps[stepIndex].key === 'workshopPublic';
    
    if (submitted) {
        return (
            <div className="workshopcreatecomplete">
                <Heading2 text={`Workshop: "${workshopForm['workshopName']}" has been created!`} />
            </div>
        )
    }
    
    return (
        <>

            <Heading2 text={steps[stepIndex].label}/>
    
            {
                isPublicKey ? (
                    <YesNoButton onClickYes={handleYesClick} onClickNo={handleSubmit}/>
                ) : (
                    <>
                        <input 
                        onChange={handleChange} 
                        value={workshopForm[steps[stepIndex].key]} 
                        type={steps[stepIndex].type || "text"} 
                        onKeyDown={(event) => event.key === "Enter" && handleNext()}
                        className="textInput" />
            
                        <NextButton onClick={handleNext} />
                    </>
                )
            }
        </>
    );
}

export function RegistrationPage() {

    // List of objects to keep track, display and update form field responses.
    
    const steps = [
        {key: 'firstName', label: 'first name'},
        {key: 'lastName', label: 'last name'},
        {key: 'email', label: 'email', type: 'email'},
        {key: 'userName', label: 'username'},
        {key: 'userPhone', label: 'Phone Number'},
        {key: 'userPassword1', label: 'Choose a password', type: 'password'}
    ];

    const handleSubmit = async () => {
        try {
            const response = await axios.post(`${process.env.REACT_APP_API_BASE}/users/registration`,
            { username: formData['userName'], email: formData['email'], first_name: formData['firstName'], last_name: formData['lastName'], user_password: formData['userPassword1'], user_type: formData['userType'], user_phone: formData['userPhone'] },
            { headers: {'Content-Type': 'application/json'} });
            console.log(`User Created: ${formData['userName']}`);
        }
        catch (error) {
            console.log(`Internal Server Error: ${error}`);
        }
    }

    const [formData, setFormData] = useState(
        {firstName: '', lastName: '' , email:'', userName: '', userType: 'user', 
        userPassword1: '', userPhone: ''}
        );
    const [stepIndex, setStepIndex] = useState(0);

    const handleNext = () => {
        console.log('Next Clicked. Current Step:', stepIndex);
        if (stepIndex < steps.length - 1) {
            setStepIndex(stepIndex + 1);
        } else {
            console.log('Submitted:', formData);
            handleSubmit();
        }
    }
    
    const handleChange = (event) => {
        setFormData({ ...formData, [steps[stepIndex].key]: event.target.value });
    }

    return (
        <>
                <div className="menuBarIconContainer">
                    <MenuBarIcon />
                </div>
                
                <Heading2 text={steps[stepIndex].label}/>
                
                
                    <>
                        <input 
                            onChange={handleChange} 
                            value={formData[steps[stepIndex].key]} 
                            type={steps[stepIndex].type || "text"} 
                            onKeyDown={(event) => event.key === "Enter" && handleNext()}
                            className="textInput"
                        />
                        <NextButton onClick={handleNext}></NextButton>
                    </>
        </>
    )
}

export function WorkshopModules() {

    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [RSVPStatus, setRSVPStatus] = useState();
    const [createFormSelected, setCreateFormSelected] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [progressData, setProgressData] = useState([]);
    const [moduleCreateFormData, setModuleCreateFormData] = useState({moduleName: ''});
    const [moduleCreated, setModuleCreated] = useState(false);
    const [workshopName, setWorkshopName] = useState('Untitled');
    const { setModuleStatus } = useContext(ProgressContext);

    const { workshopId, moduleId } = useParams();

    const accessToken = localStorage.getItem('accessToken');

    const decodedToken = jwtDecode(accessToken);

    const userId = decodedToken.user_id;

    const location = useLocation();

    const navigate = useNavigate();

    useEffect(() => {
        const fetchRSVPStatus = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_BASE}/workshops/${workshopId}/rsvp/${userId}/status`, { 
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

    const handleSubmit = async (event) => {
        try {

            const response = await axios.post(`${process.env.REACT_APP_API_BASE}/workshops/${workshopId}/modules`,
            {workshop_module_name : moduleCreateFormData.moduleName},
            { headers: {'Content-Type': 'application/json', 'Authorization':`Bearer ${accessToken}`}});

            console.log(`New Module: ${moduleCreateFormData.moduleName} created for Workshop: ${workshopName}`);
            
            setModuleCreated(prevState => !prevState);
            setCreateFormSelected(prevState => !prevState);

        } catch (error) {
            console.log(`Error Handling Form Submission: ${error}`);
        }

    }

    const handleChange = (event) => {
        setModuleCreateFormData({...moduleCreateFormData, moduleName: event.target.value});
    }

    const handleClick = (event) => {
        setCreateFormSelected(prevState => {
            const newState = !prevState;
            console.log(newState);
            return newState;
        });
    }

    useEffect(() => {
        const controller = new AbortController();

        const fetchModulesAndProgress = async () => {
            try {
                const [modulesRes, workshopRes] = await Promise.all([
                    axios.get(`${process.env.REACT_APP_API_BASE}/workshops/${workshopId}/modules`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`
                        },
                        signal: controller.signal
                    }),
                    axios.get(`${process.env.REACT_APP_API_BASE}/workshops/${workshopId}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`
                        },
                        signal: controller.signal
                    })
                ]);
    
                const progressRes = await axios.get(`${process.env.REACT_APP_API_BASE}/workshops/${workshopId}/modulesprogress`, {
                    headers: {
                        'Authorization': `Bearer ${accessToken}`
                    },
                    signal: controller.signal
                });
    
                setModules(modulesRes.data);
                setWorkshopName(`${workshopRes.data[0].workshop_name} Modules`);
                setProgressData(progressRes.data);
    
                console.log(`Modules Response: ${JSON.stringify(modulesRes.data, null, 2)}`);
                console.log(`Workshop Name: ${JSON.stringify(workshopRes.data, null, 2)}`);
                console.log(`Progress Data: ${JSON.stringify(progressRes.data, null, 2)}`);
    
            } catch (error) {
                if (axios.isCancel(error)) {
                    console.log('Axios Request Was Aborted');
                    return;
                }
                console.error(`Front End Error Fetching Data: ${error}`);
            } finally {
                setLoading(false);
            }
        };
    
        fetchModulesAndProgress();

        return () => {
            console.log('Clenup: Aborting Axios Request');
            controller.abort();
        }
    }, [moduleCreated, location.pathname]);

    useEffect(() => {
	const fetchAdminStatus = async () => {
		try {
			const response = await axios.get(`${process.env.REACT_APP_API_BASE}/users/${userId}/isadmin`,{
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

    const completedModulesExists = modules.some((module) => module.workshop_module_status === 'completed');
    const openModulesExists = modules.some((module) => module.workshop_module_status === 'open');
    const processingModulesExists = modules.some((module) => module.workshop_module_status === 'processing');
    const pendingModulesExists = modules.some((module) => module.workshop_module_status === 'pending');

    if (loading) {
        return <div>loading...</div>
    }

    if (completedModulesExists === false && openModulesExists === false && pendingModulesExists === false) {
        return (
        <>
            <Heading1 text={workshopName}/>
            <Heading2 text="No modules... yet. Click create to write one."/>
            <CreateButton handleClick={handleClick} />
            {createFormSelected && (
                <>
                    <Heading2 text="Enter a Name for the Module"/>
                    <input
                        type="text"
                        onChange={handleChange}
                        value={moduleCreateFormData.moduleName}
                        onKeyDown={(event) => {event.key === 'Enter' && handleSubmit()}}
                        className='emailInput'
                        maxLength={20}
                    />
                </>
            )}
        </>
        )
    }
    
    return (
        <>
            
            <Heading1 text={workshopName}/>

            {openModulesExists && (
                <>
                    <OpenHeading />
                    {modules.map((module) => {
                        if (module.workshop_module_status !== 'open') return null;

                        const progress = progressData.find(p => p.module_id === module.workshop_module_id);
                        const promptCount = progress?.prompt_count ?? 0;
                        const responseCount = progress?.response_count ?? 0;

                        return (
                            <Link
                                to={`/workshops/${module.workshop_id}/modules/${module.workshop_module_id}/prompts/${module.first_prompt_id}`}
                                className="linkNoUnderLine cardLink"
                                state={{ moduleStatus: module.workshop_module_status }}
                            >
                                <OpenButton
                                    moduleName={module.workshop_module_name}
                                    progressValue={responseCount}
                                    maxValue={promptCount}
                                />
                            </Link>
                        );
                    })}
                </>
            )}


	    {processingModulesExists && (
                <>
                    <ProcessingHeading />
                    {modules.map((module) => {
                        if (module.workshop_module_status !== 'processing') return null;

                        const progress = progressData.find(p => p.module_id === module.workshop_module_id);
                        const promptCount = progress?.prompt_count ?? 0;
                        const responseCount = progress?.response_count ?? 0;
                                    
                        if (isAdmin || RSVPStatus) {
                            return (
                                <Link
                                    to={`/workshops/${module.workshop_id}/modules/${module.workshop_module_id}/prompts/${module.first_prompt_id}`}
                                    className="linkNoUnderLine cardLink"
                                    state={{ moduleStatus: module.workshop_module_status }}
                                >
                                    <ProcessingButton
                                        moduleName={module.workshop_module_name}
                                        isAdmin={isAdmin}
                                        RSVPStatus={RSVPStatus}
                                    />
                                </Link>
                                );
                        } else {
                            return (
                                <ProcessingButton
                                    moduleName={module.workshop_module_name}
                                    RSVPStatus={RSVPStatus}
                                />
                            )
                        }
			
                    })}
                </>
            )}

            {completedModulesExists && (<Completedheading />)}
                {modules.map((module) => (
                    module.workshop_module_status === 'completed' && (
                        <CompleteButton
                            moduleName={module.workshop_module_name}
                        />
                    ) 
                ))}

            {pendingModulesExists && <PendingHeading />}
	    {modules.map((module) => {
    		if (module.workshop_module_status !== 'pending') return null;

    		return isAdmin ? (
        		<Link
            		key={module.workshop_module_id}
            		to={`/workshops/${module.workshop_id}/modules/${module.workshop_module_id}/prompts/edit`}
            		className="linkNoUnderLine cardLink"
            		state={{
                		moduleName: module.workshop_module_name,
                		moduleId: module.workshop_module_id
    			}}
        		>
            		<PendingButton
                	moduleName={module.workshop_module_name}
                	isAdmin={isAdmin}
            		/>
        		</Link>
    		) : (
        		<PendingButton
            		key={module.workshop_module_id}
            		moduleName={module.workshop_module_name}
            		isAdmin={isAdmin}
        		/>
    		);
		})}

            {isAdmin && <CreateButton handleClick={handleClick}/>}

            {createFormSelected && (
                <>
                    <Heading2 text="Enter a Name for the Module"/>
                    <input
                        type="text"
                        onChange={handleChange}
                        value={moduleCreateFormData.moduleName}
                        onKeyDown={(event) => {event.key === 'Enter' && handleSubmit()}}
                        className='textInput'
                        maxLength={20}
                    />
                </>
            )}
        </>
    )
}

export function WorkshopPromptsPage() {
    const { workshopId, moduleId, promptId } = useParams();
    const accessToken = localStorage.getItem('accessToken');
    const decodedToken = jwtDecode(accessToken);
    const userId = decodedToken.user_id;
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
                const response = await axios.get(`${process.env.REACT_APP_API_BASE}/workshops/${workshopId}/rsvp/${userId}/status`, { 
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
                const response = await axios.get(`${process.env.REACT_APP_API_BASE}/workshops/${workshopId}/modules/${moduleId}/prompts`, { 
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
                const response = await axios.get(`${process.env.REACT_APP_API_BASE}/users/${userId}/isadmin`,{
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
                    `${process.env.REACT_APP_API_BASE}/workshops/modules/${moduleId}/progress`,
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
                    `${process.env.REACT_APP_API_BASE}/workshops/prompts/${promptId}/response`,
                    {
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${accessToken}`
                        }
                    }
                )

                if (isAdmin || RSVPStatus) {

                    const allResponsesResponse = await axios.get(
                        `${process.env.REACT_APP_API_BASE}/workshops/${workshopId}/modules/${moduleId}/prompts/${promptId}`,
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
        keyName = ''
        ) => {

            const currentTemplateId = promptsList[promptIndex]?.prompt_template_id;

            console.log('HRC enter', {currentTemplateId, index, value, selected, keyName});

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
                    setResponseData(prev => {
                        const updated = Array.isArray(prev) ? [...prev] : [];
                        updated[index] = { index, answer: value, keyName };
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
            `${process.env.REACT_APP_API_BASE}/workshops/${workshopId}/modules/${moduleId}/prompts/${promptId}/response`,
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
                 const progressRes = await axios.get(`${process.env.REACT_APP_API_BASE}/workshops/${workshopId}/modulesprogress`, {
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
                     const modules = await axios.get(`${process.env.REACT_APP_API_BASE}/workshops/${workshopId}/modules`, {
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
                            `${process.env.REACT_APP_API_BASE}/workshops/rsvp/create`,
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

export function Root() {
    const [submitHandler, setSubmitHandler] = useState(null);
    const { pathname } = useLocation();
    const { state: progressState, moduleStatus } = useContext(ProgressContext);
  
    const isEditor = pathname.includes('prompts/edit');
    const isProcessing = moduleStatus === 'processing';
    const isPromptReader = useMatch('workshops/:workshopId/modules/:moduleId/prompts/:promptId');
  
    return (
      <>
        <div className="headerBackground"></div>
        <div
          className="menuBarIconContainer"
          style={{
            display: 'grid',
            gridTemplateColumns: isEditor
              ? '1fr 1fr'
              : isPromptReader
              ? '1fr 5fr'
              : 'auto'
          }}
        >
          <MenuBarIcon />
          {isEditor && (
            <NextButton text="Submit" onClick={() => submitHandler && submitHandler()} />
          )}
          {isPromptReader && !isEditor && !isProcessing && (
            <ProgressBar current={progressState.current} max={progressState.max} />
          )}
        </div>
        <div className="body">
          <EditorSubmitContext.Provider value={setSubmitHandler}>
            <Outlet />
          </EditorSubmitContext.Provider>
        </div>
      </>
      
    );
  }

export function Analytics() {
    return (
        <>
            
            
        </>
    )
}

export function Settings() {
    return (
        <>
            
            
        </>
    )
}

export function NavPage() {
    
    
    
    return (
        <>
            
            <div className='navOptions'>
                <MainNavCard text="Workshops" link="/workshops" color="#994242"/>
                <MainNavCard text="Analytics" link="/analytics" color="#D2A478"/>
                <MainNavCard text="Documentation" link="/documentation" color="#57A15E"/>
                <MainNavCard text="Home" link="/" color="#D9D9D9"/>
                <MainNavCard text="Account" link="/settings" color="#D9D9D9"/>
                <MainNavCard text="Contact" link="/contact" color="#D9D9D9"/>
            </div>
        </>
    )
}

export function HomePage() {
    return (
        <>
            <Heading1 text="Machine Theater Collective" style={{ textAlign: "center" }}/>
            <Heading2 text="A theater company powered by software and your imagination."/>
            <NextButton text="Try Module"/>
            <Link to="login" className="linkNoUnderLine cardLink">
                <NextButton text="Log In"/>
            </Link>
            <Link to="register" className="linkNoUnderLine cardLink">
                <NextButton text="Sign Up"/>
            </Link>
        </>
    )
}

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
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
    	setSubmitHandler(() => handleSubmit);
    	return () => setSubmitHandler(null);
    },[]);    

    const handleSubmit = async () => {
        setIsSubmitting(true);
        console.log(promptsRef.current);
        try {
            const responseAddPrompts = await axios.post(
                `${process.env.REACT_APP_API_BASE}/workshops/${workshopId}/modules/${moduleId}/prompts`,
                { promptDataList: promptsRef.current },
                {headers: {'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`}}
            );
            const responseUpdateStatus = await axios.put(
                `${process.env.REACT_APP_API_BASE}/workshops/${workshopId}/modules/${moduleId}`,
                { newStatus: 'open' },
                {headers: {'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`}}
            );
            setSubmissionSuccess(true);
        } catch (error) {
            setErrorMsg('Something went wrong. Try again.');
            console.error(error);
        } finally {
            setIsSubmitting(false)
        }
    }

    // const handleSubmit = async (event) => {
    //     event.preventDefault();
        
    //     try {
    //         const response = await axios.post(`${process.env.REACT_APP_API_BASE}/users/login`,
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
                {errorMsg && <div className="error-msg">{errorMsg}</div>}
                <PromptInstruction question={`Editing Module: ${moduleName}`}/>
                <DropDown reset={dropDownReset} onSelect={handleTemplateSelect} options={['Multiple Choice','Checklist','Short Response','Drag and Drop','Sample Rater','Notation','DropDown']}/>
                { promptsList[promptIndex] && renderPromptTemplate() }
                <ModuleNavigator backActive={isFirst} backClick={handleBack} nextClick={handleNext}/>
            </>
        )
    }

