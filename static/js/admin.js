document.addEventListener('DOMContentLoaded', function() {
    const modelUploadForm = document.getElementById('modelUploadForm');
    const testConfigForm = document.getElementById('testConfigForm');
    const consoleContent = document.getElementById('consoleContent');
    const modelList = document.getElementById('modelList');
    const testModel = document.getElementById('testModel');

    function addConsoleMessage(message, type = 'info') {
        const entry = document.createElement('div');
        entry.className = `py-1 ${type === 'error' ? 'text-red-400' : type === 'warning' ? 'text-yellow-400' : 'text-gray-300'}`;
        const timestamp = new Date().toLocaleTimeString();
        entry.textContent = `[${timestamp}] ${message}`;
        consoleContent.appendChild(entry);
        consoleContent.scrollTop = consoleContent.scrollHeight;
    }

    function updateModelList() {
        fetch('/models')
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    modelList.innerHTML = '';
                    testModel.innerHTML = '';
                    
                    data.models.forEach(model => {
                        // Add to model list
                        const modelItem = document.createElement('div');
                        modelItem.className = 'model-item';
                        modelItem.innerHTML = `
                            <div class="flex items-center">
                                <span class="material-icons mr-2">description</span>
                                <span>${model.name}</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <span class="text-sm text-gray-400">${model.type}</span>
                                <button class="text-red-400 hover:text-red-300" onclick="deleteModel('${model.name}')">
                                    <span class="material-icons">delete</span>
                                </button>
                            </div>
                        `;
                        modelList.appendChild(modelItem);

                        // Add to test model select
                        const option = document.createElement('option');
                        option.value = model.name;
                        option.textContent = `${model.name} (${model.type})`;
                        testModel.appendChild(option);
                    });
                } else {
                    addConsoleMessage('Error loading models: ' + data.message, 'error');
                }
            })
            .catch(error => {
                addConsoleMessage('Error loading models: ' + error.message, 'error');
            });
    }

    // Model file selection
    document.getElementById('modelFile').addEventListener('change', function(e) {
        const fileName = this.files[0]?.name || '';
        document.getElementById('modelFileName').textContent = fileName;
    });

    // Audio file selection
    document.getElementById('testAudioFile').addEventListener('change', function(e) {
        const fileName = this.files[0]?.name || '';
        document.getElementById('audioFileName').textContent = fileName;
    });

    // Model upload form submission
    modelUploadForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData();
        const modelFile = document.getElementById('modelFile').files[0];
        const modelType = document.getElementById('modelType').value;

        if (!modelFile) {
            addConsoleMessage('Please select a model file', 'warning');
            return;
        }

        formData.append('model', modelFile);
        formData.append('type', modelType);

        addConsoleMessage(`Uploading model: ${modelFile.name}`);

        fetch('/upload_model', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                addConsoleMessage('Model uploaded successfully');
                updateModelList();
                modelUploadForm.reset();
                document.getElementById('modelFileName').textContent = '';
            } else {
                addConsoleMessage('Error uploading model: ' + data.message, 'error');
            }
        })
        .catch(error => {
            addConsoleMessage('Error uploading model: ' + error.message, 'error');
        });
    });

    // Test configuration form submission
    testConfigForm.addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = new FormData();
        const modelName = testModel.value;
        const audioFile = document.getElementById('testAudioFile').files[0];

        if (!modelName) {
            addConsoleMessage('Please select a model', 'warning');
            return;
        }

        if (!audioFile) {
            addConsoleMessage('Please select an audio file', 'warning');
            return;
        }

        formData.append('model', modelName);
        formData.append('audio', audioFile);

        addConsoleMessage(`Testing model ${modelName} with audio file: ${audioFile.name}`);

        fetch('/test_model', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                document.getElementById('testResults').textContent = 
                    JSON.stringify(data.results, null, 2);
                addConsoleMessage('Test completed successfully');
            } else {
                addConsoleMessage('Error testing model: ' + data.message, 'error');
            }
        })
        .catch(error => {
            addConsoleMessage('Error testing model: ' + error.message, 'error');
        });
    });

    // Delete model function
    window.deleteModel = function(modelName) {
        if (confirm(`Are you sure you want to delete ${modelName}?`)) {
            fetch(`/delete_model/${modelName}`, {
                method: 'DELETE'
            })
            .then(response => response.json())
            .then(data => {
                if (data.status === 'success') {
                    addConsoleMessage(`Model ${modelName} deleted successfully`);
                    updateModelList();
                } else {
                    addConsoleMessage('Error deleting model: ' + data.message, 'error');
                }
            })
            .catch(error => {
                addConsoleMessage('Error deleting model: ' + error.message, 'error');
            });
        }
    };

    // Initial model list load
    updateModelList();
    addConsoleMessage('Admin console initialized');
});
