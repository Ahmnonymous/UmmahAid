import React, { useState, useEffect } from "react";
import { Container, Row, Col, Alert } from "reactstrap";
import Breadcrumbs from "../../components/Common/Breadcrumb";
import axiosApi from "../../helpers/api_helper";
import { API_BASE_URL } from "../../helpers/url_helper";
import { getUmmahAidUser } from "../../helpers/userStorage";
import useDeleteConfirmation from "../../hooks/useDeleteConfirmation";
import DeleteConfirmationModal from "../../components/Common/DeleteConfirmationModal";

// Import Components
import FolderTree from "./FolderTree";
import FileList from "./FileList";
import FileModal from "./FileModal";
import FolderModal from "./FolderModal";
import FilePreview from "./FilePreview";
import "./FileManager.css";

const FileManager = () => {
  // State management
  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [fileModalOpen, setFileModalOpen] = useState(false);
  const [folderModalOpen, setFolderModalOpen] = useState(false);
  const [previewModalOpen, setPreviewModalOpen] = useState(false);
  
  // Edit states
  const [editFile, setEditFile] = useState(null);
  const [editFolder, setEditFolder] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  
  // Alert state
  const [alert, setAlert] = useState(null);

  // Delete confirmation hook
  const {
    deleteModalOpen,
    deleteItem,
    deleteLoading,
    showDeleteConfirmation,
    hideDeleteConfirmation,
    confirmDelete
  } = useDeleteConfirmation();

  // Meta title
  document.title = "File Manager | UmmahAid";

  // Fetch folders and files on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const currentUser = getUmmahAidUser();
      
      // Fetch folders and files in parallel
      const [foldersResponse, filesResponse] = await Promise.all([
        axiosApi.get(`${API_BASE_URL}/folders`),
        axiosApi.get(`${API_BASE_URL}/personalFiles`)
      ]);

      // Filter by center_id for tenant isolation
      const userFolders = currentUser?.center_id 
        ? foldersResponse.data.filter(f => f.center_id === currentUser.center_id)
        : foldersResponse.data;
      
      const userFiles = currentUser?.center_id
        ? filesResponse.data.filter(f => f.center_id === currentUser.center_id)
        : filesResponse.data;

      setFolders(userFolders);
      setFiles(userFiles);
    } catch (error) {
      console.error("Error fetching data:", error);
      showAlert("Failed to load files and folders", "danger");
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message, type = "success") => {
    setAlert({ message, type });
    setTimeout(() => setAlert(null), 5000);
  };

  // Folder handlers
  const handleCreateFolder = () => {
    setEditFolder(null);
    setFolderModalOpen(true);
  };

  const handleEditFolder = (folder) => {
    setEditFolder(folder);
    setFolderModalOpen(true);
  };

  const handleDeleteFolder = (folder) => {
    showDeleteConfirmation(
      {
        id: folder.id,
        name: folder.name,
        type: "folder",
        message: "This folder will be permanently removed. All files in this folder will be moved to root."
      },
      async () => {
        try {
          await axiosApi.delete(`${API_BASE_URL}/folders/${folder.id}`);
          showAlert("Folder deleted successfully", "success");
          fetchData();
          // If current folder was deleted, go back to root
          if (currentFolder === folder.id) {
            setCurrentFolder(null);
          }
        } catch (error) {
          console.error("Error deleting folder:", error);
          showAlert(error?.response?.data?.message || "Failed to delete folder", "danger");
          throw error; // Re-throw to prevent modal from closing
        }
      }
    );
  };

  const handleFolderSelect = (folderId) => {
    setCurrentFolder(folderId);
  };

  // File handlers
  const handleCreateFile = () => {
    setEditFile(null);
    setFileModalOpen(true);
  };

  const handleEditFile = (file) => {
    setEditFile(file);
    setFileModalOpen(true);
  };

  const handlePreviewFile = (file) => {
    setPreviewFile(file);
    setPreviewModalOpen(true);
  };

  const handleDeleteFile = (file) => {
    const fileName = file.name || file.file_filename || `File #${file.id}`;
    showDeleteConfirmation(
      {
        id: file.id,
        name: fileName,
        type: "file",
        message: "This file will be permanently removed from the system."
      },
      async () => {
        try {
          await axiosApi.delete(`${API_BASE_URL}/personalFiles/${file.id}`);
          showAlert("File deleted successfully", "success");
          fetchData();
        } catch (error) {
          console.error("Error deleting file:", error);
          showAlert(error?.response?.data?.message || "Failed to delete file", "danger");
          throw error; // Re-throw to prevent modal from closing
        }
      }
    );
  };

  // Get files for current folder
  const getCurrentFiles = () => {
    return files.filter(file => {
      // Normalize values for comparison
      const fileFolderId = file.folder_id === undefined || 
                           file.folder_id === null || 
                           file.folder_id === "" ? null : file.folder_id;
      
      const normalizedCurrentFolder = currentFolder === undefined || 
                                       currentFolder === null || 
                                       currentFolder === "" ? null : currentFolder;
      
      if (normalizedCurrentFolder === null) {
        return fileFolderId === null;
      }
      
      return fileFolderId == normalizedCurrentFolder;
    });
  };

  return (
    <React.Fragment>
      <div className="page-content">
        <Container fluid>
          <Breadcrumbs title="Apps" breadcrumbItem="File Manager" />

          {/* Alert */}
          {alert && (
            <Alert color={alert.type} className="mb-3" toggle={() => setAlert(null)}>
              {alert.message}
            </Alert>
          )}

          <Row>
            {/* Folder Tree - Left Sidebar */}
            <Col xl={3} lg={4} md={5}>
              <FolderTree
                folders={folders}
                currentFolder={currentFolder}
                onFolderSelect={handleFolderSelect}
                onCreateFolder={handleCreateFolder}
                onEditFolder={handleEditFolder}
                onDeleteFolder={handleDeleteFolder}
                loading={loading}
              />
            </Col>

            {/* File List - Main Content */}
            <Col xl={9} lg={8} md={7}>
              <FileList
                folders={folders}
                files={getCurrentFiles()}
                currentFolder={currentFolder}
                onCreateFile={handleCreateFile}
                onEditFile={handleEditFile}
                onPreviewFile={handlePreviewFile}
                onDeleteFile={handleDeleteFile}
                onFolderSelect={handleFolderSelect}
                loading={loading}
              />
            </Col>
          </Row>

          {/* Modals */}
          <FileModal
            isOpen={fileModalOpen}
            toggle={() => setFileModalOpen(!fileModalOpen)}
            editItem={editFile}
            folders={folders}
            currentFolder={currentFolder}
            onUpdate={fetchData}
            showAlert={showAlert}
          />

          <FolderModal
            isOpen={folderModalOpen}
            toggle={() => setFolderModalOpen(!folderModalOpen)}
            editItem={editFolder}
            folders={folders}
            currentFolder={currentFolder}
            onUpdate={fetchData}
            showAlert={showAlert}
          />

          <FilePreview
            isOpen={previewModalOpen}
            toggle={() => setPreviewModalOpen(!previewModalOpen)}
            file={previewFile}
          />

          <DeleteConfirmationModal
            isOpen={deleteModalOpen}
            toggle={hideDeleteConfirmation}
            onConfirm={confirmDelete}
            itemName={deleteItem?.name}
            itemType={deleteItem?.type}
            message={deleteItem?.message}
            loading={deleteLoading}
          />
        </Container>
      </div>
    </React.Fragment>
  );
};

export default FileManager;
