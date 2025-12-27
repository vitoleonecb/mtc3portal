import './App.css';
import { RouterProvider, createBrowserRouter, createRoutesFromElements, Route } from "react-router-dom";

import { WorkshopPromptsEditor } from './pages/WorkshopsPromptsEditor';
import { HomePage } from './pages/HomePage.jsx';
import { NavPage } from './pages/NavPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { WorkshopsPage } from './pages/WorkshopsPage';
import { RegistrationPage } from './pages/RegistrationPage';
import { LogInPage } from './pages/LogInPage';
import { WorkshopPromptsPage } from './pages/WorkshopPromptsPage';
import { WorkshopModules } from './pages/WorkshopModules';
import { WorkshopCreateForm } from './pages/WorkshopCreateForm';

import { Root } from './layout/Root';

import { DropDown } from './Buttons';
import { ProgressProvider } from './context/ProgressContext';
import { RSVP } from './EdgePages'


function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Root />}>
        <Route path="workshops/:workshopId/modules" element={ <WorkshopModules /> } />
        <Route path="workshops/:workshopId/modules/:moduleId/prompts/:promptId" element={ <WorkshopPromptsPage /> } />
        <Route path="workshops/:workshopId/modules/:moduleId/prompts/edit" element={ <WorkshopPromptsEditor /> } />
        <Route path="login" element={ <LogInPage /> } />
        <Route path="register" element={ <RegistrationPage /> } />
        <Route path="workshops/:workshopId/rsvp/:userId" element={ <RSVP /> } />
        <Route path="workshops/create" element={ <WorkshopCreateForm /> } />
        <Route path="workshops" element={ <WorkshopsPage /> } />
        <Route index element={<HomePage />} />
        <Route path="profile" element={ <Settings /> } />
        <Route path="analytics" element={ <Analytics /> } />
        <Route path="nav" element={ <NavPage /> } />
        <Route path="documentation" element={ <DocumentationPage /> } />
        <Route path="dropdown" element={ <DropDown options={['drag and drop','multiple choice','checkbox','annotation']} /> } />
      </Route>
  ));

  return (
    <ProgressProvider>
      <RouterProvider router={router} />
    </ProgressProvider>
  );
}

export default App;
