import { MenuBarIcon, DragAndDropKey, ProgressBar, ClockIcon, LocationIcon, AvatarCircle, AVATAR_COLORS } from './Icons.jsx';
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
import { WhenWhereRow, AttendeeAvatarStrip } from './Buttons.jsx';
import React, { useRef, useState, useEffect, useContext, createContext } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { Link, useParams, useNavigate, Outlet, useLocation, useMatch } from 'react-router-dom';
import { format } from 'date-fns';
import QRCode from 'react-qr-code';

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
					{/* Bottom row: three columns; buttons in left and right with empty center for spacing */}
					<NextButton to={RSVPPath} text="RSVP" style={{ gridColumn: "1", gridRow: "3" }} />
					<NextButton to={currentWorkshopPath} text="Leave" style={{ gridColumn: "3", gridRow: "3" }} />
				</div>
			) : (
				<div className="EdgeBox">
					<Heading1 text="Module Complete!" style={{ gridColumn: "1 / -1", gridRow: "1" }} />
					<Heading2
						text={`${remainingModules} module${remainingModules !== 1 ? 's' : ''} left to RSVP.`}
						style={{ gridColumn: "1 / -1", gridRow: "2" }}
					/>
					<NextButton to={nextModulePath} text="Next" style={{ gridColumn: "1", gridRow: "3" }} />
					<NextButton to={currentWorkshopPath} text="Leave" style={{ gridColumn: "3", gridRow: "3" }} />
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
    const [attendees, setAttendees] = useState([]);
    const [avatarConfig, setAvatarConfig] = useState(null);
    const [checkinToken, setCheckinToken] = useState(null);
    const accessToken = localStorage.getItem('accessToken');

    const { workshopId, userId } = useParams();

    const formatDate = (datetime) => {
        const dateTimeObject = new Date(datetime);
        const formattedDate = format(dateTimeObject, "EEEE 'at' h:mm a | MM-dd-yyyy")
        return formattedDate;
    };

    const handleToggleConfirm = async () => {
        try {
            const nextStatus = !rsvpConfirmed;
            await axios.put(
                `${import.meta.env.VITE_API_URL}/workshops/${workshopId}/rsvp/${userId}/update`,
                { confirmed: nextStatus },
                { headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' }}
            );
            setRsvpConfirmed(nextStatus);
        } catch (error) {
            console.log(`Error: ${error}`);
        }
    };

    useEffect(() => {
        const fetchRSVP = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/workshops/${workshopId}/rsvp/${userId}`,
                    { headers: { 'Authorization': `Bearer ${accessToken}` }}
                );

                const rsvpData = response.data[0];

                setFirstName(rsvpData.first_name);
                setUsername(rsvpData.username);
                setWorkshopname(rsvpData.workshop_name);
                setWorkshopDescription(rsvpData.workshop_description);
                setWorkshopDate(formatDate(rsvpData.workshop_date));
                setWorkshopLocation(rsvpData.workshop_location);
                setWorkshopPublic(rsvpData.workshop_public);
                setCheckinToken(rsvpData.checkin_token || null);

                // Normalize avatar_config from DB (can be JSON or string)
                if (rsvpData.avatar_config) {
                  try {
                    const parsed = typeof rsvpData.avatar_config === 'string'
                      ? JSON.parse(rsvpData.avatar_config)
                      : rsvpData.avatar_config;
                    console.log('[RSVP] Loaded avatar_config from API:', parsed);
                    setAvatarConfig(parsed || null);
                  } catch (e) {
                    console.error('Invalid avatar_config on RSVP:', e);
                    setAvatarConfig(null);
                  }
                } else {
                  console.log('[RSVP] No avatar_config on RSVP payload');
                  setAvatarConfig(null);
                }

                rsvpData.rsvp_confirmation_status === 'confirmed'
                  ? setRsvpConfirmed(true)
                  : setRsvpConfirmed(false);

            } catch (error) {
                console.error(`Front End Error: ${error}`);
            }
        };
        fetchRSVP();
    }, [workshopId, userId]);

    // Fetch confirmed attendees for horizontal avatar strip
    useEffect(() => {
        const fetchAttendees = async () => {
            try {
                const response = await axios.get(
                    `${import.meta.env.VITE_API_URL}/workshops/${workshopId}/attendees`,
                    { headers: { 'Authorization': `Bearer ${accessToken}` } }
                );
                setAttendees(response.data || []);
            } catch (error) {
                console.error(`Front End Error (attendees): ${error}`);
            }
        };
        fetchAttendees();
    }, [workshopId, rsvpConfirmed]);

    const titleText = firstName && workshopName
      ? `${firstName}'s RSVP for ${workshopName}`
      : 'RSVP';

    const avatarSeed = username || firstName || String(userId || "");

    const checkinUrl = checkinToken
      ? `${window.location.origin}/rsvp/checkin/${encodeURIComponent(checkinToken)}`
      : null;

    // If we have a stored avatar_config, derive colors from palette
    let avatarProps = {};
    if (avatarConfig) {
      const {
        rings,
        strokeWidth,
        backgroundColorIndex,
        ringColorIndices,
        centerColorIndex,
      } = avatarConfig;

      const palette = AVATAR_COLORS;
      const maxRings = 6;
      const safeRings = Math.max(1, Math.min(rings ?? 1, maxRings));
      const backgroundColor = palette[(backgroundColorIndex ?? 0) % palette.length];
      const ringColors = Array.from({ length: safeRings }, (_, i) => {
        const idx = ringColorIndices?.[i] ?? 0;
        return palette[idx % palette.length];
      });
      const centerColor = palette[(centerColorIndex ?? 0) % palette.length];

      avatarProps = {
        rings: safeRings,
        strokeWidth: strokeWidth ?? 2,
        backgroundColor,
        ringColors,
        centerColor,
      };
    }

    return (
        <>
            <div className="EdgeBox">
                {/* Row 1: title (cols 1-2) + avatar (col 3) aligned to top */}
                <div
                  className="RSVPTextBlock"
                  style={{ gridColumn: "1 / 3", gridRow: "1" }}
                >
                  <h1 className="workshopCardName RSVPTitle">{titleText}</h1>
                </div>

                {/* Row 2: full-width RSVP details (extend under avatar into col 3) */}
                <div
                  className="RSVPTextBlock"
                  style={{ gridColumn: "1 / 4", gridRow: "2" }}
                >
                  {workshopDescription && (
                    <p className="RSVPDetailText">
                      {workshopDescription}
                    </p>
                  )}

                  <WhenWhereRow icon={<ClockIcon size={14} />} label={workshopDate} />
                  <WhenWhereRow icon={<LocationIcon size={14} />} label={`${workshopLocation} (${workshopPublic ? 'Public' : 'In Studio'})`} />
                </div>

                {/* Row 3: centered QR code spanning full width */}
                {checkinUrl && (
                  <div
                    style={{
                      gridColumn: "1 / 4",
                      gridRow: "3",
                      marginTop: "15px",
                      marginBottom: "15px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      gap: "0.5rem",
                    }}
                  >
                    <div style={{ maxWidth: 192, marginLeft: "auto", marginRight: "auto" }}>
                      <QRCode
                        value={checkinUrl}
                        size={192}
                        style={{ width: '100%', height: 'auto' }}
                      />
                    </div>
                  </div>
                )}

        <div
          style={{
            gridColumn: "3",
            gridRow: "1",
            justifySelf: "end",
            alignSelf: "start",
          }}
        >
          <AvatarCircle
            seed={avatarSeed}
            size={40}
            {...avatarProps}
          />
        </div>

                {/* Row 4: shared container – avatars on left, button on right, vertically centered */}
                <div
                  style={{
                    gridColumn: "1 / 4",
                    gridRow: "4",
                    marginTop: "0.75rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <AttendeeAvatarStrip attendees={attendees} currentUserId={Number(userId)} />

                  <div
                    className="RSVPConfirmButtonContainer"
                  >
                    <button
                      onClick={handleToggleConfirm}
                      className={rsvpConfirmed ? "logInButton logInButton--pressed" : "logInButton"}
                      type="button"
                    >
                      {rsvpConfirmed ? 'Unconfirm' : 'Confirm'}
                    </button>
                  </div>
                </div>
		    </div>
        </>
    );
}
