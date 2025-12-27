import React from 'react';
import {MenuBarIcon} from './Icons.jsx'

export function ModuleHeader() {
    return (
        <div className="ModuleHeader" >
            <MenuBarIcon />
            <div className="ModuleProgressBarContainer" >
                <progress className="ModuleProgress" value=".75"/>
            </div>
        </div>
    )
}