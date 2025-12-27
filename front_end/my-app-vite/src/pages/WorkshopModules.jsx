import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";

import axios from "axios";
import { jwtDecode } from "jwt-decode";

import { ProgressContext } from '../context/ProgressContext.jsx'

import { 
    OpenButton,
    ProcessingButton,
    CompleteButton,
    PendingButton,
    CreateButton,
} from "../Buttons.jsx";

import {
    OpenHeading,
    ProcessingHeading,
    Completedheading,
    PendingHeading,
} from "../Headings.jsx";

import { Heading1, Heading2 } from "../Headings.jsx";

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

    const location = useLocation();

    const navigate = useNavigate();

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

    const handleSubmit = async (event) => {
        try {

            const response = await axios.post(`${import.meta.env.VITE_API_URL}/workshops/${workshopId}/modules`,
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
                    axios.get(`${import.meta.env.VITE_API_URL}/workshops/${workshopId}/modules`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`
                        },
                        signal: controller.signal
                    }),
                    axios.get(`${import.meta.env.VITE_API_URL}/workshops/${workshopId}`, {
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${accessToken}`
                        },
                        signal: controller.signal
                    })
                ]);
    
                const progressRes = await axios.get(`${import.meta.env.VITE_API_URL}/workshops/${workshopId}/modulesprogress`, {
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