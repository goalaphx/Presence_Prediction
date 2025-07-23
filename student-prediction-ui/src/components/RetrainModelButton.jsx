import React, { useState } from 'react';
import { Button, Modal, Spinner, Alert } from 'react-bootstrap';
import { BsCpuFill } from 'react-icons/bs';
import * as api from '../services/apiService';

const RetrainModelButton = () => {
    const [showModal, setShowModal] = useState(false);
    const [isTraining, setIsTraining] = useState(false);
    const [feedback, setFeedback] = useState({ type: '', message: '' });

    const handleShow = () => {
        setFeedback({ type: '', message: '' });
        setShowModal(true);
    };
    const handleClose = () => setShowModal(false);

    const handleRetrain = async () => {
        setIsTraining(true);
        setFeedback({ type: '', message: '' });

        try {
            const response = await api.retrainModel();
            setFeedback({ type: 'success', message: response.message || 'Training initiated successfully.' });
        } catch (error) {
            setFeedback({ type: 'danger', message: error.message || 'An unknown error occurred.' });
        } finally {
            setIsTraining(false);
        }
    };

    return (
        <>
            {/* === THIS IS THE CHANGE === */}
            {/* Removed variant="outline-light" and added className="btn-retrain" */}
            <Button onClick={handleShow} className="btn-retrain d-flex align-items-center gap-2">
                <BsCpuFill />
                Retrain Model
            </Button>

            <Modal show={showModal} onHide={handleClose} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Model Retraining</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>
                        Are you sure you want to start the model retraining process?
                    </p>
                    <p className="text-muted">
                        This will use the latest data from the database to create a new `attendance_model.pkl` file. This process may take several minutes and should not be interrupted.
                    </p>
                    {feedback.message && (
                        <Alert variant={feedback.type} className="mt-3">
                            {feedback.message}
                        </Alert>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose} disabled={isTraining}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleRetrain} disabled={isTraining}>
                        {isTraining ? (
                            <>
                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                                {' '}Training...
                            </>
                        ) : (
                            'Start Retraining'
                        )}
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default RetrainModelButton;