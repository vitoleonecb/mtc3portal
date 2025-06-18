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
    CreateButton,
    DropDown } from './Buttons.js';
import { Heading1, Heading2, PromptInstruction, Completedheading, PendingHeading , OpenHeading , ProcessingHeading } from './Headings.js';
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useParams, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { format } from 'date-fns';

export function DocumentationPage() {
    return (
        <>
        </>
    );
}

export function WorkshopsPage() {
    
    const [workshopsList, setWorkshopsList] = useState([]); 

    const accessToken = localStorage.getItem('accessToken');

    useEffect(() => {
        const fetchWorkshops = async () => {
            try {
                const workshopsResponse = await axios.get(`${process.env.REACT_APP_API_BASE}/workshops`, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization' : `BEARER ${accessToken}`
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

    const formatDate = (datetime) => {

        const dateTimeObject = new Date(datetime);

        const formattedDate = format(dateTimeObject, "EEEE 'at' h:mm a | MM-dd-yyyy")
        
        return formattedDate;
    };

    return (
        <>
            
            <Heading1 text="Workshops" />
            {workshopsList.map((workshop) => (
            <Link to={`/workshops/${workshop.workshop_id}/modules`} className="linkNoUnderLine">
                <WorkshopCard
                        key={workshop.workshop_id}
                        workshopName={workshop.workshop_name} 
                        workshopDescription={workshop.workshop_description} 
                        workshopDate={formatDate(workshop.workshop_date)} 
                        workshopLocation={workshop.workshop_location}
                    />
            </Link>))}
        </>
        
    )
}

export function LogInPage() {
    
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');

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
        } catch (error) {
            console.log(`Server Error: ${error}`);
        }
        
        console.log(`Email: ${email}`);
        console.log(`Password: ${password}`);
    }

    return (
        <>
            <Heading1 text="Log In" style="center"/>
            <form className="logInForm" onSubmit={handleSubmit}>
                <Heading2 text="Email"/>
                <input onChange={handleEmailChange} value={email} className="emailInput" type="email">
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
                        className="emailInput" />
            
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
        {key: 'intro', label: 'Welcome to the Machine Theater Collective. Click next to start your registration.'},
        {key: 'userName', label: 'Make a fun username for other users to see.'},
        {key: 'firstName', label: 'What\'s your first name? This will be hidden from other users.'},
        {key: 'lastName', label: 'What\'s your last name? This will also be hidden from other users.'},
        {key: 'email', label: 'What email should we use for sending RSVPs or notifications if asked?', type: 'email'},
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

    const isIntro = stepIndex === 0;

    return (
        <>
                <div className="menuBarIconContainer">
                    <MenuBarIcon />
                </div>
                
                <Heading2 text={steps[stepIndex].label}/>
                
                {isIntro ? (
                        <NextButton onClick={handleNext}/>
                    ) : (
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
                )}
        </>
    )
}

export function WorkshopModules() {

    const [modules, setModules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [createFormSelected, setCreateFormSelected] = useState(false);
    const [moduleCreateFormData, setModuleCreateFormData] = useState({moduleName: ''});
    const [moduleCreated, setModuleCreated] =useState(false);
    const { workshopId } = useParams();
    const [workshopName, setWorkshopName] = useState('Untitled');
    const accessToken = localStorage.getItem('accessToken');
    const navigate = useNavigate();

    const handleSubmit = async (event) => {
        try {

            const response = await axios.post(`${process.env.REACT_APP_API_BASE}/workshops/${workshopId}/modules`,
            {workshop_module_name : moduleCreateFormData.moduleName},
            { headers: {'Content-Type': 'application/json', 'Authorization':`BEARER ${accessToken}`}});

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

        const fetchModules = async () => {
            try {
                
                const response = await axios.get(`${process.env.REACT_APP_API_BASE}/workshops/${workshopId}/modules`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `BEARER ${accessToken}`
                    },
                    signal: controller.signal
                });

                const workshopResponse = await axios.get(`${process.env.REACT_APP_API_BASE}/workshops/${workshopId}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `BEARER ${accessToken}`
                    },
                    signal: controller.signal
                });

                setWorkshopName(`${workshopResponse.data[0].workshop_name} Modules`);
                setModules(response.data);
                const responseData = JSON.stringify(response.data, null, 2);
                const workshopResponseData = JSON.stringify(workshopResponse.data, null, 2);

                console.log(`Axios Response: ${responseData}`);
                console.log(`Axios Response: ${workshopResponseData}`);
                
            } catch (error) {
                if(axios.isCancel(error)) {
                    console.log('Axios Request Was Aborted');
                    return;
                }
                console.error(`Front End Error Fetching Data: ${error}`);
                setLoading(false);
            } finally {
                setLoading(false);
            }
        };

        fetchModules();

        return () => {
            console.log('Clenup: Aborting Axios Request');
            controller.abort();
        }
    }, [moduleCreated]);

    const completedModulesExists = modules.some((module) => module.workshop_module_status === 'completed');
    const openModulesExists = modules.some((module) => module.workshop_module_status === 'open');
    const pendingModulesExists = modules.some((module) => module.workshop_module_status === 'pending');

    if (loading) {
        return <div>loading...</div>
    }

    if (completedModulesExists === false & openModulesExists === false & pendingModulesExists === false) {
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

            {openModulesExists && (<OpenHeading />)}
                {modules.map((module) => (
                    module.workshop_module_status === 'open' && (
                        <Link 
                        to={`/workshops/${module.workshop_id}/modules/${module.workshop_module_id}/prompts`} 
                        className="linkNoUnderLine"
                        >
                            <OpenButton
                                progressValue={module.workshop_module_progress} 
                                moduleName={module.workshop_module_name}
                            />
                        </Link>    
                            
                    ) 
                ))}

            {completedModulesExists && (<Completedheading />)}
                {modules.map((module) => (
                    module.workshop_module_status === 'completed' && (
                        <CompleteButton
                            moduleName={module.workshop_module_name}
                        />
                    ) 
                ))}

            {pendingModulesExists && (<PendingHeading />)}
                {modules.map((module) => (
                    module.workshop_module_status === 'pending' && (
                        <Link 
                        to={`/workshops/${module.workshop_id}/modules/${module.workshop_module_id}/prompts/edit`} 
                        className="linkNoUnderLine"
                        state={{moduleName: module.workshop_module_name, moduleId: module.workshop_module_id}}>

                            <PendingButton 
                                moduleName={module.workshop_module_name}
                                isAdmin={true}
                            />

                        </Link>
                    )
                ))}

            <CreateButton handleClick={handleClick}/>

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
    const { workshopId, moduleId } = useParams();
    const accessToken = localStorage.getItem('accessToken');
    const [promptsList, setPromptsList] = useState([]);
    const [promptIndex, setPromptIndex] = useState(0);
    const [progress, setProgress] = useState(10);
    const [formData, setFormData] = useState();

    useEffect(() => {
        const fetchPromptInformation = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_BASE}/workshops/${workshopId}/modules/${moduleId}/prompts`, { 
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `BEARER ${accessToken}`
                    }
                });

                console.log(JSON.stringify(response.data));
                setPromptsList(response.data);

            } catch (error) {
                console.log(`Front End Fetch Error: ${error}`);
            }
        }

        fetchPromptInformation();

    }, [workshopId, moduleId, accessToken]);

    const handleSubmit = () => {
        // Submission logic
    }

    const handleNext = () => {
        if (promptIndex < promptsList.length - 1) {
            setPromptIndex((prevIndex) => prevIndex + 1);
        } else {
            handleSubmit();
        }
    }

    const handleBack = () => {
        setPromptIndex((prevIndex) => prevIndex - 1);
    }

    const prompt = promptsList[promptIndex];
    const instructionNeeded = prompt?.prompt_template_id !== 9 && prompt?.prompt_template_id !== 4 && prompt?.prompt_template_id !== 7 && prompt?.prompt_template_id !== 8;

    const renderPrompt = () => {
        const prompt = promptsList[promptIndex];

        if (!prompt) {
            return <div>Loading...</div>; // Safe fallback while data is still loading
        }

        console.log(prompt);

        // switch case to render different templates based on prompt_template_id
        switch (prompt.prompt_template_id) {
            case 1:
                return <MultipleChoiceTemplate multipleChoiceOptions={prompt.workshop_prompt_options}/>;
            case 3:
                return <CheckListTemplate checkListOptions={prompt.workshop_prompt_options} />;
            case 4:
                return <ShortResponseTemplate shortResponseOptions={prompt.workshop_prompt_options}/>
            case 6:
                return <DragAndDropTemplate dragOptions={prompt.workshop_prompt_options}/>
            case 7:
                return <SampleRaterTemplate reference={prompt.workshop_prompt_reference}/>
            case 8:
                return <ScriptNotationTemplate reference={prompt.workshop_prompt_reference}/>
            case 9:
                return <DropDownTemplate dropDownOptions={prompt.workshop_prompt_options}/>
            default:
                return <div>Unknown Template</div>;
        }
    }

    const isFirst = promptIndex === 0;

    return (
        <>
            {/* Ensure prompt data exists before trying to display */}
            {instructionNeeded && <Heading1 text={promptsList[promptIndex]?.workshop_prompt_instruction || 'Loading...'} />}

            {renderPrompt()}

            <ModuleNavigator backActive={isFirst} backClick={handleBack} nextClick={handleNext}/>
        </>
    );
}

export function Root() {
    return (
        <>
            <div className='menuBarIconContainer'>
                <MenuBarIcon/>
            </div>
            <div className="body">
                <Outlet/>
            </div>
        </>
    )
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

export function Home() {
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
            
            <Heading1 text="Machine Theater Collective" style="center"/>
            <Heading2 text="A theater company powered by software and your imagination."/>
            <NextButton text="Try Module"/>
        </>
    )
}


export function OpenResponseTemplate() {
    const [question, setQuestion] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const accessToken = localStorage.getItem('accessToken');


    useEffect(() => {
        const controller = new AbortController();

        const fetchDataTest = async () => {
            try {
                const response = await axios.get(`${process.env.REACT_APP_API_BASE}/workshops/4/modules/3/prompts`, {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `BEARER ${accessToken}`
                    },
                    signal: controller.signal
                });

                console.log('Axios Response:', response.data);

                if (!response.data || !response.data[0].workshop_prompt_instruction) {
                    throw new Error('workshop_prompt_instruction is missing in response');
                }

                setQuestion(response.data[0].workshop_prompt_instruction);
                setLoading(false);
            } catch (error) {
                if (axios.isCancel(error)) {
                    console.log('Axios request was aborted');
                    return;
                }
                console.error(`Front End Error Fetching Data: ${error}`);
                setError('Failed to load question. Please try again.');
                setLoading(false);
            }
        };

        fetchDataTest();

        return () => {
            console.log('Cleanup: Aborting Axios request');
            controller.abort();
        };
    }, []);

    console.log('Final question state before render:', question);

    return (
        <>
            <PromptInstruction question={error || question} />
            <OpenResponse />
        </>
    );
}

export function MultipleChoiceTemplate({ multipleChoiceOptions }) {
    
    return (
        <>
            <MultipleChoiceGroup options={multipleChoiceOptions}/>
        </>
    )
}

export function DropDownTemplate({ dropDownOptions }) {
    return (
        <>
            {dropDownOptions.map((item, i) => (
                <div className="DropdownPromptContainer" key={i}>
                    <h1 class="Heading1" style={{ marginBottom: '20px' }}>{item.question}</h1>
                    <DropDown options={item.options}/>
                </div>
            ))}
        </>
    )
}

export function CheckListTemplate({ checkListOptions }) {
    
    return (
        <>
            {Object.values(checkListOptions).map((option) => {
                return <CheckBoxButton optionText={option} />
            })}
        </>
    )
};

export function ScriptNotationTemplate({reference}) {
    return (
        <>
            <PromptInstruction question="Annotate the following script"/>
            <ScriptSampleNotate sample={reference} />
            <OpenResponse />
            <ModuleNavigator />  
        </>
    )
}

export function SampleRaterTemplate({reference}) {
    
    return (
        <>
            <PromptInstruction question="Rate the following"/>
            <ScriptSampleRate sample={reference} />
            <StarRater/>
        </>
    )
}

export function ShortResponseTemplate({shortResponseOptions}) {
    
    return (
        <>
            {Object.values(shortResponseOptions).map((option) => {
                return (
                    <>
                        <Heading2 text={option}/>
                        <ShortResponseArea/>
                    </>
                )
            })}
            
        </>
            
    )
}

export function DragAndDropTemplate({dragOptions}) {
    return (
        <>
            <DragAndDropArea />
            <DragAndDropKey dragOptions={dragOptions}/>
        </>
    )
}

export function WorkshopPromptsEditor() {
    
    // const { workshopId, moduleId } = useParams();

    // const accessToken = localStorage.getItem('accessToken');
    
    // const [promptIndex, setPromptIndex] = useState(0);
    // const [promptsList, setPromptsList] = useState([]);
    // const [selectedTemplate, setSelectedTemplate] = useState(null);
    // const [formData, setFormData] = useState();
    // const location = useLocation();
    // const { moduleName } = location.state || {};

    // const handleNext = () => {
    //     if (promptIndex < promptsList.length - 1) {
    //         setPromptIndex((prevIndex) => prevIndex + 1);
    //     } else {
    //         handleSubmit();
    //     }
    // }

    // const handleBack = () => {
    //     setPromptIndex((prevIndex) => prevIndex - 1);
    // }

    // const isFirst = promptIndex === 0;
    
    // const renderPromptTemplate = () => {
    //     const prompt = promptsList[promptIndex];

    //     if (!prompt) {
    //         return <div>Loading...</div>; // Safe fallback while data is still loading
    //     }

    //     console.log(prompt);

    //     // switch case to render different templates based on prompt_template_id
    //     switch (prompt.prompt_template_id) {
    //         case 1:
    //             return <CreateMultipleChoiceTemplate />;
    //         case 3:
    //             return <CreateCheckListTemplate />;
    //         case 4:
    //             return <CreateShortResponseTemplate />
    //         case 6:
    //             return <CreateDragAndDropTemplate />
    //         case 7:
    //             return <CreateSampleRaterTemplate />
    //         case 8:
    //             return <CreateScriptNotationTemplate />
    //         case 9:
    //             return <CreateDropDownTemplate/>
    //         default:
    //             return <div>Unknown Template</div>;
    //     }
    // }

    // return (
    //     <>
    //         <PromptInstruction question={`Editing Module: ${moduleName}`}/>
    //         <DropDown options={['Multiple Choice','Checklist','Short Response','Drag and Drop','Sample Rater','Notation','DropDown']}/>
    //         { selectedTemplate && renderPromptTemplate() }
    //         <ModuleNavigator backActive={isFirst} backClick={handleBack} nextClick={handleNext}/>
    //     </>
    // )
}