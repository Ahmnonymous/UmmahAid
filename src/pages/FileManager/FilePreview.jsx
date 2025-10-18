import React, { useState, useEffect } from "react";
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Spinner,
  Alert,
} from "reactstrap";
import { API_BASE_URL } from "../../helpers/url_helper";

const FilePreview = ({ isOpen, toggle, file }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && file) {
      setLoading(false);
      setError(null);
    }
  }, [isOpen, file]);

  if (!file) return null;

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileIcon = (mimetype, filename) => {
    if (!mimetype && !filename) return "bx-file";

    const ext = filename ? filename.split(".").pop().toLowerCase() : "";

    if (mimetype?.includes("pdf") || ext === "pdf") return "bxs-file-pdf";
    if (mimetype?.includes("word") || ["doc", "docx"].includes(ext))
      return "bxs-file-doc";
    if (
      mimetype?.includes("excel") ||
      mimetype?.includes("spreadsheet") ||
      ["xls", "xlsx"].includes(ext)
    )
      return "bx-spreadsheet";
    if (mimetype?.includes("image") || ["jpg", "jpeg", "png", "gif", "bmp", "svg"].includes(ext))
      return "bx-image";
    if (
      mimetype?.includes("video") ||
      ["mp4", "avi", "mov", "wmv"].includes(ext)
    )
      return "bx-video";
    if (
      mimetype?.includes("audio") ||
      ["mp3", "wav", "ogg"].includes(ext)
    )
      return "bx-music";
    if (
      mimetype?.includes("zip") ||
      mimetype?.includes("compressed") ||
      ["zip", "rar", "7z"].includes(ext)
    )
      return "bx-archive";
    if (mimetype?.includes("text") || ext === "txt") return "bx-file-blank";

    return "bx-file";
  };

  const canPreview = (mimetype, filename) => {
    if (!mimetype && !filename) return false;

    const ext = filename ? filename.split(".").pop().toLowerCase() : "";

    // Images
    if (mimetype?.includes("image") || ["jpg", "jpeg", "png", "gif", "bmp", "svg"].includes(ext)) {
      return true;
    }

    // PDF
    if (mimetype?.includes("pdf") || ext === "pdf") {
      return true;
    }

    // Text files
    if (mimetype?.includes("text") || ext === "txt") {
      return true;
    }

    // Audio
    if (mimetype?.includes("audio") || ["mp3", "wav", "ogg"].includes(ext)) {
      return true;
    }

    // Video
    if (mimetype?.includes("video") || ["mp4", "webm", "ogg"].includes(ext)) {
      return true;
    }

    return false;
  };

  const renderPreview = () => {
    if (!file.file_filename) {
      return (
        <Alert color="warning">
          <i className="bx bx-error-circle me-2"></i>
          No file available for preview
        </Alert>
      );
    }

    const mimetype = file.file_mime;
    const filename = file.file_filename;
    const ext = filename ? filename.split(".").pop().toLowerCase() : "";

    // Image preview
    if (mimetype?.includes("image") || ["jpg", "jpeg", "png", "gif", "bmp", "svg"].includes(ext)) {
      return (
        <div className="text-center">
          <img
            src={`${API_BASE_URL}/personalFiles/${file.id}/view-file`}
            alt={file.name}
            className="img-fluid rounded"
            style={{ maxHeight: "500px" }}
            onError={(e) => {
              e.target.style.display = "none";
              setError("Failed to load image");
            }}
          />
        </div>
      );
    }

    // PDF preview
    if (mimetype?.includes("pdf") || ext === "pdf") {
      return (
        <div style={{ height: "500px" }}>
          <iframe
            src={`${API_BASE_URL}/personalFiles/${file.id}/view-file`}
            title={file.name}
            width="100%"
            height="100%"
            className="border-0"
          />
        </div>
      );
    }

    // Text file preview
    if (mimetype?.includes("text") || ext === "txt") {
      return (
        <div style={{ height: "400px", overflowY: "auto" }}>
          <iframe
            src={`${API_BASE_URL}/personalFiles/${file.id}/view-file`}
            title={file.name}
            width="100%"
            height="100%"
            className="border"
          />
        </div>
      );
    }

    // Audio preview
    if (mimetype?.includes("audio") || ["mp3", "wav", "ogg"].includes(ext)) {
      return (
        <div className="text-center py-4">
          <i className="bx bx-music display-1 text-primary mb-3"></i>
          <audio controls className="w-100">
            <source
              src={`${API_BASE_URL}/personalFiles/${file.id}/view-file`}
              type={mimetype}
            />
            Your browser does not support the audio element.
          </audio>
        </div>
      );
    }

    // Video preview
    if (mimetype?.includes("video") || ["mp4", "webm", "ogg"].includes(ext)) {
      return (
        <div className="text-center">
          <video controls className="w-100" style={{ maxHeight: "500px" }}>
            <source
              src={`${API_BASE_URL}/personalFiles/${file.id}/view-file`}
              type={mimetype}
            />
            Your browser does not support the video element.
          </video>
        </div>
      );
    }

    // Default - no preview available
    return (
      <div className="text-center py-5">
        <i className={`bx ${getFileIcon(mimetype, filename)} display-1 text-muted mb-3`}></i>
        <h5>Preview not available</h5>
        <p className="text-muted">
          This file type cannot be previewed. Please download it to view.
        </p>
        <Button
          color="primary"
          onClick={() => {
            window.open(
              `${API_BASE_URL}/personalFiles/${file.id}/download-file`,
              "_blank"
            );
          }}
        >
          <i className="bx bx-download me-1"></i>
          Download File
        </Button>
      </div>
    );
  };

  const handleDownload = () => {
    window.open(
      `${API_BASE_URL}/personalFiles/${file.id}/download-file`,
      "_blank"
    );
  };

  return (
    <Modal isOpen={isOpen} toggle={toggle} centered size="xl" backdrop="static">
      <ModalHeader toggle={toggle}>
        <i className="bx bx-show me-2"></i>
        {file.name || file.file_filename || "File Preview"}
      </ModalHeader>

      <ModalBody>
        {/* File Info */}
        <div className="mb-3 p-2 bg-light rounded">
          <div className="row">
            <div className="col-md-6">
              <div className="mb-2">
                <strong>File Name:</strong> {file.file_filename || "N/A"}
              </div>
              <div className="mb-2">
                <strong>Size:</strong> {formatFileSize(file.file_size)}
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-2">
                <strong>Type:</strong>{" "}
                {file.file_filename
                  ? file.file_filename.split(".").pop().toUpperCase()
                  : "N/A"}
              </div>
              <div className="mb-2">
                <strong>Uploaded:</strong>{" "}
                {file.created_at
                  ? new Date(file.created_at).toLocaleString()
                  : "N/A"}
              </div>
            </div>
          </div>
        </div>

        {/* Preview */}
        {loading ? (
          <div className="text-center py-5">
            <Spinner color="primary" />
            <div className="mt-2">Loading preview...</div>
          </div>
        ) : error ? (
          <Alert color="danger">
            <i className="bx bx-error-circle me-2"></i>
            {error}
          </Alert>
        ) : (
          renderPreview()
        )}
      </ModalBody>

      <ModalFooter>
        <Button color="primary" onClick={handleDownload}>
          <i className="bx bx-download me-1"></i>
          Download
        </Button>
        <Button color="light" onClick={toggle}>
          Close
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default FilePreview;

