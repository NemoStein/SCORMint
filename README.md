# SCORMint
A simple SCORM interface written in ES6, heavily based on Pipwerks implementation.

# Docs
## Installation
```Bash
npm install scormint --save
```

## Usage
```JavaScript
import SCORM from 'scormint';

const scorm = new SCORM();

// Initializing the connection with the API
scorm.initialize();

// Setting a field (suspend_data, in this case) in the API
scorm.set('cmi.suspend_data', 'Hello World!');

// Setting the lesson_status as complete
scorm.status('complete');

// Commiting the changes
scorm.save();
```

## SCORMint API docs

* [constructor](#constructor) - Creates a SCORM object
* [initialize](#initialize) - Connects and initialize the API
* [terminate](#terminate) - Terminate the connection with the API
* [status(status)](#statusstatus) - Gets or sets the lesson status
* [get(key)](#getkey) - Gets a field from the API
* [set(key, value)](#getkey-value) - Sets a field from the API
* [save()](#save) - Persists/Commits the changes in the API
* [lastErrorCode()](#lasterrorcode) - Gets the last error reported by the API
* [errorString(code)](#errorstringcode) - Gets the text representation of the error code
* [version](#version) - The selected version of the SCORM API
* [connected](#connected) - The status of the connection
* [updateStatusAfterInitialize](#updatestatusafterinitialize) - Update lesson/completion status after initialization
* [updateStatusBeforeTerminate](#updatestatusbeforeterminate) - Update exit status before terminate
* [SCORM.VERSION_1_2](#scormversion_1_2) - Constant defining API version 1.2
* [SCORM.VERSION_2004](#scormversion_2004) - Constant defining API version 2004

### constructor(version)

```javascript
const scorm = new SCORM('1.2');
```

#### version
Type: `undefined` or `String`

The desired SCORM API version. Leave blank for autodetect (priorize SCORM 1.2).

### initialize()

Connects and initialize the API

### terminate()

Terminate the connection with the API

### status(status)

Gets or sets the lesson status
If `status` is ommited, returns the lesson status. Sets the status otherwise.

#### status
Type: `undefined` or `String`

The status of the lesson

### get(key)

Gets a field from the API

#### key
Type: `String`

The cmi key of the field

### set(key, value)

Sets a field in the API

#### key
Type: `String`

The cmi key of the field

#### value
Type: `any`

The value to persist. Any object passed here will be cast to string.

### save()

Persists/Commits the changes in the API

### lastErrorCode()

Gets the last error reported by the API

### errorString(code)

Gets the text representation of the error code

#### value
Type: `String`

The code returned by `lastErrorCode()`

### version

The selected version of the SCORM API

### connected

The status of the connection
`true` if connected to the SCORM API, `false` otherwise

### updateStatusAfterInitialize

Determines if the lesson/completion status should be changed from 'not attempted' to 'incomplete' after initialization
Defaults to `true`

### updateStatusBeforeTerminate

Determines if the exit status should be set as 'suspend' or 'logout' (depending on lesson/completion status) before terminate
Defaults to `true`

### SCORM.VERSION_1_2
1.2

### SCORM.VERSION_2004
2004