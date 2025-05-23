import React from 'react';
import {MenuBarIcon} from './Icons.js'

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