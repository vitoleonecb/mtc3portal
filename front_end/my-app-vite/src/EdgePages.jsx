import { MenuBarIcon, DragAndDropKey, ProgressBar } from './Icons.jsx';
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
    CreateButton,
    DropDown } from './Buttons.jsx';
import { Heading1, Heading2, PromptInstruction, Completedheading, PendingHeading , OpenHeading , ProcessingHeading } from './Headings.jsx';
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

export function ModuleEdge({ nextModulePath, currentWorkshopPath, remainingModules, RSVPEarned, RSVPPath }) {
	
    console.log(`RSVPPath: ${RSVPPath}`);
    
    return (
		<>
			{remainingModules === 0 ? (
				<div className="EdgeBox">
					<Heading1 text="Module Complete!" style={{ gridColumn: "1 / -1", gridRow: "1" }} />
					<Heading2 text="Your RSVP is ready." style={{ gridColumn: "1 / -1", gridRow: "2" }} />
					<NextButton to={RSVPPath} text="RSVP" style={{ gridColumn: "1", gridRow: "3" }} />
					<NextButton to={currentWorkshopPath} text="Leave" style={{ gridColumn: "2", gridRow: "3" }} />
				</div>
			) : (
				<div className="EdgeBox">
					<Heading1 text="Module Complete!" style={{ gridColumn: "1 / -1", gridRow: "1" }} />
					<Heading2
						text={`${remainingModules} module${remainingModules !== 1 ? 's' : ''} left to RSVP.`}
						style={{ gridColumn: "1 / -1", gridRow: "2" }}
					/>
					<NextButton to={nextModulePath} text="Next" style={{ gridColumn: "1", gridRow: "3" }} />
					<NextButton to={currentWorkshopPath} text="Leave" style={{ gridColumn: "2", gridRow: "3" }} />
				</div>
			)}
		</>
	);
}


export function RSVP() {
    const [firstName, setFirstName] = useState(null);
    const [username, setUsername] = useState(null);
    const [workshopName, setWorkshopname] = useState(null);
    const [workshopDescription, setWorkshopDescription] = useState(null);
    const [workshopDate, setWorkshopDate] = useState(null);
    const [workshopLocation, setWorkshopLocation] = useState(null);
    const [workshopPublic, setWorkshopPublic] = useState(false);
    const [rsvpConfirmed, setRsvpConfirmed] = useState(false);
    const accessToken = localStorage.getItem('accessToken');

    const { workshopId, userId } = useParams();

    const formatDate = (datetime) => {
        const dateTimeObject = new Date(datetime);
        const formattedDate = format(dateTimeObject, "EEEE 'at' h:mm a | MM-dd-yyyy")
        return formattedDate;
    };

    const onClick = async () => {
        try {
            const response = await axios.put(
                `${import.meta.env.VITE_API_URL}/workshops/${workshopId}/rsvp/${userId}/update`,
                {},
                { headers: { 'Authorization': `Bearer ${accessToken}` }}
            )
            setRsvpConfirmed(true);
        } catch (error) {
            console.log(`Error: ${error}`);
        }
    }

    useEffect(() => {
        
        const fetchRSVP = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/workshops/${workshopId}/rsvp/${userId}`, 
                    { headers: { 'Authorization': `Bearer ${accessToken}` }}
                )

                const rsvpData = response.data[0];

                setFirstName(rsvpData.first_name);
                setUsername(rsvpData.username);
                setWorkshopname(rsvpData.workshop_name);
                setWorkshopDescription(rsvpData.workshop_description);
                setWorkshopDate(formatDate(rsvpData.workshop_date));
                setWorkshopLocation(rsvpData.workshop_location);
                setWorkshopPublic(rsvpData.workshop_public);
                rsvpData.rsvp_confirmation_status === 'confirmed' ? setRsvpConfirmed(true): setRsvpConfirmed(false);

            } catch (error) {
                console.error(`Front End Error: ${error}`)
            }
        }   
        fetchRSVP();
    },[rsvpConfirmed]);

    return (
        <>
            <div className="EdgeBox">
                    <Heading1 text={`${firstName}'s RSVP for ${workshopName}`} />
                    <Heading2 text={`${workshopDescription}`} />
                    <Heading2 text={`${workshopDate}`} />
                    <Heading2 text={`${workshopLocation}`} />
                    {workshopPublic ? (<Heading2 text="Public Workshop" />) : (<Heading2 text="In Studio" />)}
                    {rsvpConfirmed ? (<NextButton text="RSVP Confirmed" />) : (<NextButton onClick={onClick} text="Confirm RSVP" />)}
			    </div>
        </>
    )
}