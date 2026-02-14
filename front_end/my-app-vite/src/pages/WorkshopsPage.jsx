import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { Link, useLocation } from "react-router-dom";
import { format } from "date-fns";

// UI Components
import { Heading1, Heading2 } from "../Headings.jsx";
import { CreateButton } from "../Buttons.jsx";
import { DropDown } from "../Buttons.jsx";
import { WorkshopCard } from "../Buttons.jsx";
import { RAW_CHARACTERS } from "../components/card-characters.jsx";
import { createRng, pickFrom } from "../utils/random.js";
import { MysqlDateInput } from "../DateInput.jsx";
import { useOverlay } from "../context/OverlayContext.jsx";
import { ErrorOverlay } from "../components/ErrorOverlay.jsx";
import { classifyError } from "../errors/errorRegistry.js";


export function WorkshopsPage() {
    
    const [workshopsList, setWorkshopsList] = useState([]);
    const { key: locationKey } = useLocation();
    const [isAdmin, setIsAdmin] = useState(false);
    const [createFormSelected, setCreateFormSelected] = useState(false);
    const [date, setDate] = useState('');
    const [currentStep, setCurrentStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const { show } = useOverlay();

    // State for POST via API

    const [workshopCreateForm, setWorkshopCreateForm] = useState({
        workshopName : '',
        workshopDescription : '',
        workshopTime : '',
        workshopLocation : '',
        workshopStyle : ''
    });

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

    useEffect(() => {
        const fetchWorkshops = async () => {
            try {
                const workshopsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/workshops`, {
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
            `${import.meta.env.VITE_API_URL}/workshops`,
            payload,
            { headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` } }
          );
      
          // refresh list
          const workshopsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/workshops`, {
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
          const classification = classifyError(err, { hint: "WORKSHOP_CREATE_FAILED" });
          show(<ErrorOverlay classification={classification} />);
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
    const workshopDecorations = useMemo(() => {
        const DECORATION_PROB = 0.25;
        const placements = [
          "cardDecoration-top-right",
          "cardDecoration-top-left",
          "cardDecoration-edge-right",
          "cardDecoration-edge-left",
        ];
        const map = {};

        workshopsList.forEach((workshop) => {
            const rng = createRng(`workshop-${workshop.workshop_id}-${locationKey}`);
            if (rng() < DECORATION_PROB) {
                const placement = pickFrom(rng, placements);
                if (!placement) return;

                // Always use one of the four raw SVG characters.
                const RawChar = pickFrom(rng, RAW_CHARACTERS);
                if (RawChar) {
                    // Mostly small/medium; big characters ~10% of the time.
                    const bigChance = 0.1;
                    let scale;
                    if (rng() < bigChance) {
                      // Big: bias toward upper range 1.4x–2.4x
                      const t = rng();
                      scale = 1.4 + t * 1.0;
                    } else {
                      // Small/medium: 0.2x–1.2x, skewed toward smaller with t^2
                      const t = rng();
                      scale = 0.2 + (t * t) * 1.0;
                    }

                    map[workshop.workshop_id] = (
                      <div
                        className={`cardDecoration ${placement}`}
                        style={{
                          transform: `scale(${scale})`,
                          transformOrigin: "center center",
                        }}
                      >
                        <RawChar />
                      </div>
                    );
                }
            }
        });
        return map;
    }, [workshopsList, locationKey]);

    const getWorkshopDecoration = (id) => workshopDecorations[id] || null;

    return (
        <>
            
            <Heading1 text="Workshops" />
            {workshopsList.map((workshop) => (
                <div key={workshop.workshop_id} className="cardLink">
                  <Link to={`/workshops/${workshop.workshop_id}/modules`} className="linkNoUnderLine">
                    <WorkshopCard
                      workshopName={workshop.workshop_name}
                      workshopDescription={workshop.workshop_description}
                      workshopDate={formatDate(workshop.workshop_date)}
                      workshopLocation={workshop.workshop_location}
                      decoration={getWorkshopDecoration(workshop.workshop_id)}
                    />
                  </Link>
                </div>
            ))}

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