import React, { useEffect, useState } from "react";
import axios from "axios";
import { ResponseProcessor } from "../Processing.jsx";
import { DropDown } from "../Buttons.jsx";

export function WorkshopReviewPanel({
  workshopId,
  selectedModuleId,
  selectedPromptId,
  onModuleChange,
  onPromptChange,
}) {
  const [modules, setModules] = useState([]);
  const [prompts, setPrompts] = useState([]);
  const [responses, setResponses] = useState([]);
  const [currentPrompt, setCurrentPrompt] = useState(null);

  const accessToken = localStorage.getItem("accessToken");

  // Load modules for this workshop
  useEffect(() => {
    if (!workshopId) return;

    const fetchModules = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/workshops/${workshopId}/modules`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        setModules(res.data || []);
        if (!selectedModuleId && res.data?.length) {
          onModuleChange?.(res.data[0].workshop_module_id);
        }
      } catch (error) {
        console.error("WorkshopReviewPanel modules error", error);
      }
    };

    fetchModules();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workshopId]);

  // Load prompts when module changes
  useEffect(() => {
    if (!workshopId || !selectedModuleId) {
      setPrompts([]);
      return;
    }

    const fetchPrompts = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/workshops/${workshopId}/modules/${selectedModuleId}/prompts`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        setPrompts(res.data || []);
        if (!selectedPromptId && res.data?.length) {
          onPromptChange?.(res.data[0].workshop_prompt_id);
        }
      } catch (error) {
        console.error("WorkshopReviewPanel prompts error", error);
      }
    };

    fetchPrompts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [workshopId, selectedModuleId]);

  // Load responses + set current prompt
  useEffect(() => {
    if (!selectedPromptId) {
      setResponses([]);
      setCurrentPrompt(null);
      return;
    }

    const fetchResponses = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/workshops/${workshopId}/modules/${selectedModuleId}/prompts/${selectedPromptId}`,
          {
            headers: { Authorization: `Bearer ${accessToken}` },
          }
        );
        setResponses(res.data || []);
      } catch (error) {
        console.error("WorkshopReviewPanel responses error", error);
        setResponses([]);
      }
    };

    const prompt = prompts.find((p) => p.workshop_prompt_id === Number(selectedPromptId));
    setCurrentPrompt(prompt || null);

    fetchResponses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPromptId, selectedModuleId, workshopId]);

  const handleModuleSelect = (_label, index) => {
    const module = modules[index];
    if (!module) return;
    onModuleChange?.(module.workshop_module_id ?? null);
  };

  const handlePromptSelect = (_label, index) => {
    const prompt = prompts[index];
    if (!prompt) return;
    onPromptChange?.(prompt.workshop_prompt_id ?? null);
  };

  const moduleOptions = modules.map((m) => m.workshop_module_name || "Untitled module");
  const promptOptions = prompts.map((p) => String(p.workshop_prompt_id));

  return (
    <div className="WorkshopReviewPanel">
      <div className="WorkshopReviewControls">
        <div className="QuestionProcessing" style={{ marginTop: 0 }}>
          Module:
        </div>
        <DropDown options={moduleOptions} onSelect={handleModuleSelect} />

        <div className="QuestionProcessing" style={{ marginTop: 16 }}>
          Prompt:
        </div>
        <DropDown options={promptOptions} onSelect={handlePromptSelect} />
      </div>

      <div className="WorkshopReviewContent">
        {currentPrompt && (
          <ResponseProcessor
            promptId={currentPrompt.workshop_prompt_id}
            allResponses={responses}
            templateId={currentPrompt.prompt_template_id}
            isAdmin={true}
            promptOptions={currentPrompt.workshop_prompt_options}
            currentUserResponseId={null}
            currentUserName={"Admin"}
          />
        )}
      </div>
    </div>
  );
}