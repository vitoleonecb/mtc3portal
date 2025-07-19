import './App.css';
import { RouterProvider, createBrowserRouter, createRoutesFromElements, Route } from "react-router-dom";

import { 
  WorkshopModules,
  WorkshopPromptsPage,
  CheckListTemplate, 
  MultipleChoiceTemplate,
  ScriptNotationTemplate,
  SampleRaterTemplate,
  ShortResponseTemplate,
  DragAndDropTemplate,
  LogInPage,
  RegistrationPage,
  WorkshopCreateForm,
  WorkshopsPage,
  Settings,
  Analytics,
  NavPage,
  DocumentationPage,
  HomePage,
  WorkshopPromptsEditor,
  Root
} from './Pages';

import { DropDown } from './Buttons';
import { ProgressProvider } from './Pages'; // or wherever your provider is defined

function App() {
  const router = createBrowserRouter(createRoutesFromElements(
    <>
      <Route path="/" element={<Root/>}>
        <Route path="workshops/:workshopId/modules" element={ <WorkshopModules /> } />
        <Route path="workshops/:workshopId/modules/:moduleId/prompts/:promptId" element={ <WorkshopPromptsPage /> } />
        <Route path="workshops/:workshopId/modules/:moduleId/prompts/edit" element={ <WorkshopPromptsEditor /> } />
        <Route path="login" element={ <LogInPage /> } />
        <Route path="register" element={ <RegistrationPage /> } />
        <Route path="workshops/create" element={ <WorkshopCreateForm /> } />
        <Route path="workshops" element={ <WorkshopsPage /> } />
        <Route index element={<HomePage />} />
        <Route path="profile" element={ <Settings /> } />
        <Route path="analytics" element={ <Analytics /> } />
        <Route path="nav" element={ <NavPage /> } />
        <Route path="documentation" element={ <DocumentationPage /> } />
        <Route path="dropdown" element={ <DropDown options={['drag and drop','multiple choice','checkbox','annotation']} /> } />
      </Route>
    </>
  ));

  return (
    <ProgressProvider>
      <RouterProvider router={router} />
    </ProgressProvider>
  );
}

export default App;