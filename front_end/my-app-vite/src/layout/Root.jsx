import React, { useState, useContext } from 'react';
import { Outlet, useLocation, useMatch, useNavigate } from 'react-router-dom';

import { MenuBarIcon, AccountAvatarButton } from '../Icons.jsx';
import { NextButton } from '../Buttons.jsx';
import { ProgressBar } from '../Icons.jsx';
import { ProgressContext } from '../context/ProgressContext';
import { EditorSubmitContext } from '../context/EditorSubmitContext.jsx';
import { ScrollBackgroundLayer } from '../components/ScrollBackgroundLayer.jsx';

export function Root() {
  const [submitHandler, setSubmitHandler] = useState(null);
  const { pathname, key: locationKey } = useLocation();
  const navigate = useNavigate();
  const { state: progressState, moduleStatus } = useContext(ProgressContext);

  const isEditor =
    pathname.includes('prompts/edit') ||
    pathname.includes('/materials/edit');
  const isPromptReader = useMatch('workshops/:workshopId/modules/:moduleId/prompts/:promptId');

  // In "open" phase we show the progress bar; in other phases (processing,
  // completed, etc.) we hide it but still treat the route as a reader.
  const isOpenPhaseReader = !!(isPromptReader && moduleStatus === 'open');
  const isCompletedPhaseReader = !!(isPromptReader && moduleStatus === 'completed');

  const showProgressBar = isOpenPhaseReader && !isEditor;
  const showMaterialsButton = isCompletedPhaseReader && !isEditor;
  const showSubmitButton = isEditor;
  const isLoggedIn = !!localStorage.getItem('accessToken');
  const showAvatar = isLoggedIn && !isOpenPhaseReader; // hide avatar when logged out or during open-phase reader
 
  return (
    <>
      <div className="headerBackground"></div>

      {/* Scroll-linked background overlay that anchors tiles to
          document height but does not affect layout or scroll. */}
      <ScrollBackgroundLayer
        variant="dots-haze"
        density="medium"
        seed={`${pathname}-${locationKey}`}
        className="appBackgroundLayer"
      />

      <div
        className="menuBarIconContainer"
        style={{
          display: 'grid',
          gridTemplateColumns:
            showSubmitButton && showAvatar
              ? 'auto 1fr auto'   // editor: menu, submit, avatar
              : showSubmitButton && !showAvatar
              ? 'auto 1fr'        // editor edge-case without avatar (unused today)
              : showProgressBar && !showAvatar
              ? 'auto 1fr'        // open reader: menu + progress bar only
              : (showMaterialsButton && showAvatar)
              ? 'auto 1fr auto'   // completed reader: menu, materials btn, avatar
              : showAvatar
              ? 'auto 1fr auto'   // default pages: menu, spacer, avatar
              : 'auto',
          alignItems: 'center'
        }}
      >
        <MenuBarIcon />

        {/* Middle column: submit button (editor) or progress bar (open reader) */}
        {showSubmitButton && (
          <NextButton text="Submit" onClick={() => submitHandler && submitHandler()} />
        )}
        {showProgressBar && (
          <ProgressBar current={progressState.current} max={progressState.max} />
        )}
        {showMaterialsButton && (
          <NextButton
            text="View Materials"
            onClick={() => navigate(`/workshops/${isPromptReader.params.workshopId}/materials`)}
          />
        )}

        {/* Right column: account avatar (hidden only in open-phase reader) */}
        {showAvatar && <AccountAvatarButton />}
      </div>

      <div className="body">
        {/* White content column that covers background shapes behind main content */}
        <div className="contentBackplate" aria-hidden="true" />
        <EditorSubmitContext.Provider value={setSubmitHandler}>
          <Outlet />
        </EditorSubmitContext.Provider>
      </div>
    </>
  );
}
