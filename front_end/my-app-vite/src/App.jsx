import './App.css';
import { RouterProvider, createBrowserRouter, createRoutesFromElements, Route } from "react-router-dom";

import { WorkshopPromptsEditor } from './pages/WorkshopsPromptsEditor';
import { WorkshopMaterialsEditor } from './pages/WorkshopMaterialsEditor.jsx';
import { WorkshopMaterialsViewer } from './pages/WorkshopMaterialsViewer.jsx';
import { HomePage } from './pages/HomePage.jsx';
import { NavPage } from './pages/NavPage';
import { DocumentationPage } from './pages/DocumentationPage';
import { Analytics } from './pages/Analytics';
import { Settings } from './pages/Settings';
import { RegistrationPage } from './pages/RegistrationPage';
import { LogInPage } from './pages/LogInPage';
import { WorkshopPromptsPage } from './pages/WorkshopPromptsPage';
import { WorkshopModules } from './pages/WorkshopModules';
import { WorkshopCreateForm } from './pages/WorkshopCreateForm';
import { CycleConfigPage } from './pages/CycleConfigPage';
import { ShowcasesPage } from './pages/ShowcasesPage';
import { ShowcaseDetailPage } from './pages/ShowcaseDetailPage';
import { ShowcaseTicketViewPage } from './pages/ShowcaseTicketViewPage';
import { MembershipPage } from './pages/MembershipPage';
import { TicketPurchasePage } from './pages/TicketPurchasePage';

import { Root } from './layout/Root';

import { DropDown } from './Buttons';
import { ProgressProvider } from './context/ProgressContext';
import { RSVP } from './EdgePages';
import { OverlayProvider } from './context/OverlayContext.jsx';
import { StripeProvider } from './context/StripeContext.jsx';
import { RsvpCheckinPage } from './pages/RsvpCheckinPage.jsx';
import { RsvpScanner } from './pages/RsvpScanner.jsx';

function App() {
  const router = createBrowserRouter(
    createRoutesFromElements(
      <Route path="/" element={<Root />}>
        <Route path="workshops/:workshopId/modules" element={ <WorkshopModules /> } />
        <Route path="workshops/:workshopId/modules/:moduleId/prompts/:promptId" element={ <WorkshopPromptsPage /> } />
        <Route path="workshops/:workshopId/modules/:moduleId/prompts/edit" element={ <WorkshopPromptsEditor /> } />
        <Route path="workshops/:workshopId/materials" element={ <WorkshopMaterialsViewer /> } />
        <Route path="workshops/:workshopId/materials/edit" element={ <WorkshopMaterialsEditor /> } />
        <Route path="login" element={ <LogInPage /> } />
        <Route path="register" element={ <RegistrationPage /> } />
        <Route path="workshops/:workshopId/rsvp/:userId" element={ <RSVP /> } />
        <Route path="rsvp/checkin/:token" element={ <RsvpCheckinPage /> } />
        <Route path="admin/rsvp-scan" element={ <RsvpScanner /> } />
        <Route path="admin/cycle" element={ <CycleConfigPage /> } />
        <Route path="showcases/:showcaseId/ticket" element={ <TicketPurchasePage /> } />
        <Route path="showcases/:showcaseId/ticket/view" element={ <ShowcaseTicketViewPage /> } />
        <Route path="showcases/:showcaseId" element={ <ShowcaseDetailPage /> } />
        <Route path="showcases" element={ <ShowcasesPage /> } />
        <Route path="membership" element={ <MembershipPage /> } />
        <Route path="workshops/create" element={ <WorkshopCreateForm /> } />
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
      <OverlayProvider>
        <StripeProvider>
          <RouterProvider router={router} />
        </StripeProvider>
      </OverlayProvider>
    </ProgressProvider>
  );
}

export default App;
