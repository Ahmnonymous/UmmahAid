import React, { useState } from "react";
import { Card, CardBody, Nav, NavItem, NavLink, TabContent, TabPane } from "reactstrap";
import classnames from "classnames";
import CommentsTab from "./tabs/CommentsTab";
import TasksTab from "./tabs/TasksTab";
import RelationshipsTab from "./tabs/RelationshipsTab";
import HomeVisitsTab from "./tabs/HomeVisitsTab";
import FinancialAssistanceTab from "./tabs/FinancialAssistanceTab";
import FoodAssistanceTab from "./tabs/FoodAssistanceTab";
import AttachmentsTab from "./tabs/AttachmentsTab";
import ProgramsTab from "./tabs/ProgramsTab";
import FinancialAssessmentTab from "./tabs/FinancialAssessmentTab";

const DetailTabs = ({
  applicantId,
  comments,
  tasks,
  relationships,
  homeVisits,
  financialAssistance,
  foodAssistance,
  attachments,
  programs,
  financialAssessment,
  lookupData,
  onUpdate,
  showAlert,
}) => {
  const [activeTab, setActiveTab] = useState("all");

  const toggleTab = (tab) => {
    if (activeTab !== tab) {
      setActiveTab(tab);
    }
  };

  const currentId = Number(applicantId);
  const safeNum = (v) => (v === null || v === undefined || v === "" ? NaN : Number(v));

  const commentsForApplicant = (comments || []).filter((x) => safeNum(x.file_id) === currentId);
  const tasksForApplicant = (tasks || []).filter((x) => safeNum(x.file_id) === currentId);
  const relationshipsForApplicant = (relationships || []).filter((x) => safeNum(x.file_id) === currentId);
  const homeVisitsForApplicant = (homeVisits || []).filter((x) => safeNum(x.file_id) === currentId);
  const financialAssistanceForApplicant = (financialAssistance || []).filter((x) => safeNum(x.file_id) === currentId);
  const foodAssistanceForApplicant = (foodAssistance || []).filter((x) => safeNum(x.file_id) === currentId);
  const attachmentsForApplicant = (attachments || []).filter((x) => safeNum(x.file_id) === currentId);
  const programsForApplicant = (programs || []).filter((x) => safeNum(x.person_trained_id) === currentId);
  const financialAssessmentForApplicant = Array.isArray(financialAssessment)
    ? (financialAssessment || []).find((x) => safeNum(x.file_id) === currentId) || null
    : financialAssessment || null;

  const tabs = [
    { id: "all", label: "Show All", count: commentsForApplicant.length + tasksForApplicant.length + relationshipsForApplicant.length + homeVisitsForApplicant.length + financialAssistanceForApplicant.length + foodAssistanceForApplicant.length + attachmentsForApplicant.length + programsForApplicant.length + (financialAssessmentForApplicant ? 1 : 0), color: "secondary" },
    { id: "1", label: "Comments", count: commentsForApplicant.length, color: "primary" },
    { id: "2", label: "Tasks", count: tasksForApplicant.length, color: "info" },
    { id: "3", label: "Relationships", count: relationshipsForApplicant.length, color: "success" },
    { id: "4", label: "Home Visits", count: homeVisitsForApplicant.length, color: "warning" },
    { id: "5", label: "Financial Aid", count: financialAssistanceForApplicant.length, color: "primary" },
    { id: "6", label: "Food Aid", count: foodAssistanceForApplicant.length, color: "success" },
    { id: "7", label: "Files", count: attachmentsForApplicant.length, color: "info" },
    { id: "8", label: "Programs", count: programsForApplicant.length, color: "primary" },
    { id: "9", label: "Finance", count: financialAssessmentForApplicant ? 1 : 0, color: "success" },
  ];

  return (
    <Card>
      <CardBody className="py-3">
        <h5 className="card-title mb-3 fw-semibold font-size-15">
          <i className="bx bx-detail font-size-16 align-middle me-2 text-primary"></i>
          Applicant Details & History
        </h5>
        
        <Nav pills className="nav-pills-custom mb-3 d-flex flex-wrap">
          {tabs.map((tab) => (
            <NavItem key={tab.id} className="mb-1">
              <NavLink
                className={classnames({ active: activeTab === tab.id })}
                onClick={() => toggleTab(tab.id)}
                style={{ cursor: "pointer", padding: "0.35rem 0.65rem", fontSize: "0.8rem" }}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`badge bg-soft-${tab.color} text-${tab.color} ms-1 font-size-10 px-1 py-0`}>
                    {tab.count}
                  </span>
                )}
              </NavLink>
            </NavItem>
          ))}
        </Nav>

        <TabContent activeTab={activeTab}>
          <TabPane tabId="all">
            <div className="border rounded p-3 mb-3">
              <h5 className="text-primary mb-3">
                <i className="bx bx-comment-dots me-2"></i>Comments
              </h5>
              <CommentsTab applicantId={applicantId} comments={commentsForApplicant} onUpdate={onUpdate} showAlert={showAlert} />
            </div>
            
            <div className="border rounded p-3 mb-3">
              <h5 className="text-primary mb-3">
                <i className="bx bx-task me-2"></i>Tasks
              </h5>
              <TasksTab applicantId={applicantId} tasks={tasksForApplicant} onUpdate={onUpdate} showAlert={showAlert} />
            </div>
            
            <div className="border rounded p-3 mb-3">
              <h5 className="text-primary mb-3">
                <i className="bx bx-group me-2"></i>Relationships
              </h5>
              <RelationshipsTab applicantId={applicantId} relationships={relationshipsForApplicant} lookupData={lookupData} onUpdate={onUpdate} showAlert={showAlert} />
            </div>
            
            <div className="border rounded p-3 mb-3">
              <h5 className="text-primary mb-3">
                <i className="bx bx-home me-2"></i>Home Visits
              </h5>
              <HomeVisitsTab applicantId={applicantId} homeVisits={homeVisitsForApplicant} onUpdate={onUpdate} showAlert={showAlert} />
            </div>
            
            <div className="border rounded p-3 mb-3">
              <h5 className="text-primary mb-3">
                <i className="bx bx-dollar me-2"></i>Financial Assistance
              </h5>
              <FinancialAssistanceTab applicantId={applicantId} financialAssistance={financialAssistanceForApplicant} lookupData={lookupData} onUpdate={onUpdate} showAlert={showAlert} />
            </div>
            
            <div className="border rounded p-3 mb-3">
              <h5 className="text-primary mb-3">
                <i className="bx bx-food-menu me-2"></i>Food Assistance
              </h5>
              <FoodAssistanceTab applicantId={applicantId} foodAssistance={foodAssistanceForApplicant} lookupData={lookupData} onUpdate={onUpdate} showAlert={showAlert} />
            </div>
            
            <div className="border rounded p-3 mb-3">
              <h5 className="text-primary mb-3">
                <i className="bx bx-paperclip me-2"></i>Attachments
              </h5>
              <AttachmentsTab applicantId={applicantId} attachments={attachmentsForApplicant} onUpdate={onUpdate} showAlert={showAlert} />
            </div>
            
            <div className="border rounded p-3 mb-3">
              <h5 className="text-primary mb-3">
                <i className="bx bx-book-reader me-2"></i>Programs
              </h5>
              <ProgramsTab applicantId={applicantId} programs={programsForApplicant} lookupData={lookupData} onUpdate={onUpdate} showAlert={showAlert} />
            </div>
            
            <div className="border rounded p-3 mb-3">
              <h5 className="text-primary mb-3">
                <i className="bx bx-calculator me-2"></i>Financial Assessment
              </h5>
              <FinancialAssessmentTab applicantId={applicantId} financialAssessment={financialAssessmentForApplicant} lookupData={lookupData} onUpdate={onUpdate} showAlert={showAlert} />
            </div>
          </TabPane>
          <TabPane tabId="1">
            <CommentsTab
              applicantId={applicantId}
              comments={commentsForApplicant}
              onUpdate={onUpdate}
              showAlert={showAlert}
            />
          </TabPane>

          <TabPane tabId="2">
            <TasksTab
              applicantId={applicantId}
              tasks={tasksForApplicant}
              onUpdate={onUpdate}
              showAlert={showAlert}
            />
          </TabPane>

          <TabPane tabId="3">
            <RelationshipsTab
              applicantId={applicantId}
              relationships={relationshipsForApplicant}
              lookupData={lookupData}
              onUpdate={onUpdate}
              showAlert={showAlert}
            />
          </TabPane>

          <TabPane tabId="4">
            <HomeVisitsTab
              applicantId={applicantId}
              homeVisits={homeVisitsForApplicant}
              onUpdate={onUpdate}
              showAlert={showAlert}
            />
          </TabPane>

          <TabPane tabId="5">
            <FinancialAssistanceTab
              applicantId={applicantId}
              financialAssistance={financialAssistanceForApplicant}
              lookupData={lookupData}
              onUpdate={onUpdate}
              showAlert={showAlert}
            />
          </TabPane>

          <TabPane tabId="6">
            <FoodAssistanceTab
              applicantId={applicantId}
              foodAssistance={foodAssistanceForApplicant}
              lookupData={lookupData}
              onUpdate={onUpdate}
              showAlert={showAlert}
            />
          </TabPane>

          <TabPane tabId="7">
            <AttachmentsTab
              applicantId={applicantId}
              attachments={attachmentsForApplicant}
              onUpdate={onUpdate}
              showAlert={showAlert}
            />
          </TabPane>

          <TabPane tabId="8">
            <ProgramsTab
              applicantId={applicantId}
              programs={programsForApplicant}
              lookupData={lookupData}
              onUpdate={onUpdate}
              showAlert={showAlert}
            />
          </TabPane>

          <TabPane tabId="9">
            <FinancialAssessmentTab
              applicantId={applicantId}
              financialAssessment={financialAssessmentForApplicant}
              lookupData={lookupData}
              onUpdate={onUpdate}
              showAlert={showAlert}
            />
          </TabPane>
        </TabContent>
      </CardBody>
    </Card>
  );
};

export default DetailTabs;

