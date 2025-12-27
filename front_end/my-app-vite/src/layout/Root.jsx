import React, { useState, useContext } from 'react';
import { Outlet, useLocation, useMatch } from 'react-router-dom';

import { MenuBarIcon } from '../Icons.jsx';
import { NextButton } from '../Buttons.jsx';
import { ProgressBar } from '../Icons.jsx';
import { ProgressContext } from '../context/ProgressContext';
import { EditorSubmitContext } from '../context/EditorSubmitContext.jsx';

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
