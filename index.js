'use strict'

export default class SCORM
{
	/**
	 * @param {String} [version] The desired SCORM API version. Leave blank for autodetect (priorize SCORM 1.2).
	 * 
	 * @throws Throws if request `version` is invalid.
	 */
	constructor(version)
	{
		if (version !== SCORM.VERSION_1_2 && version !== SCORM.VERSION_2004)
		{
			throw new Error(`Invalid version ${version}. Expected: [${SCORM.VERSION_1_2}, ${SCORM.VERSION_2004}]`)
		}
		
		/**
		 * Determines if the lesson/completion status should be changed from 'not attempted' to 'incomplete' after initialization
		 * 
		 * @member {Boolean} updateStatusAfterInitialize
		 */
		this.updateStatusAfterInitialize = true
		
		/**
		 * Determines if the exit status should be set as 'suspend' or 'logout' (depending on lesson/completion status) before terminate
		 * 
		 * @member {Boolean} updateStatusBeforeTerminate
		 */
		this.updateStatusBeforeTerminate = true
		
		/** @private */ this._version = version
		/** @private */ this._depth = 10
		/** @private */ this._api = null
		/** @private */ this._connected = false
	}

	/**
	 * The selected version of the SCORM API
	 * 
	 * @member {String} version
	 */
	get version()
	{
		return this._version
	}

	/**
	 * The status of the connection
	 * `true` if connected to the SCORM API, `false` otherwise
	 * 
	 * @member {Boolean} connected
	 */
	get connected()
	{
		return this._connected
	}
	
	/**
	 * @protected
	 * @param {Window[]} windows Array of windows to search for SCORM API
	 */
	findAPI(windows)
	{
		let api1_2 = this.version && this.version !== SCORM.VERSION_1_2
		let api2004 = this.version && this.version !== SCORM.VERSION_2004
		
		both: for (let window of windows)
		{
			let attempts = 0
			
			do
			{
				api1_2 = api1_2 || window.API
				api2004 = api2004 || window.API_1484_11
				
				if (api1_2 && api2004)
				{
					break both
				}
			}
			while (window.parent && window.parent != window && attempts++ <= this._depth)
		}
		
		if (this.version)
		{
			this._api = (this.isV1() ? window.API : window.API_1484_11)
			
			if (!this._api)
			{
				throw new Error(`SCORM ${this.version} API requested but not found`)
			}
		}
		else
		{
			if (window.API)
			{
				this._version = SCORM.VERSION_1_2
				this._api = window.API
			}
			else if (window.API_1484_11)
			{
				this._version = SCORM.VERSION_2004
				this._api = window.API_1484_11
			}
			
			if (!this._api)
			{
				throw new Error(`SCORM API not found`)
			}
		}
		
		return this
	}
	
	/**
	 * Connects and initialize the API
	 */
	initialize()
	{
		if (this._connected)
		{
			console.log('SCORM API already connected')
			return
		}
		
		try
		{
			this.findAPI([window, window.top.opener])
		}
		catch (error)
		{
			console.warn(error.message)
			return
		}
		
		const connected = (this.isV1() ? this._api.LMSInitialize('') : this._api.Initialize(''))
		if (!connected)
		{
			console.warn("Could not connect to SCORM API")
		}
		
		this._connected = true
		
		if (this.updateStatusAfterInitialize)
		{
			const completion = this.status()
			if (!completion || completion === 'not attempted' || completion === 'unknown')
			{
				this.status('incomplete')
				this.save()
			}
		}
	}
	
	/**
	 * Terminate the connection with the API
	 */
	terminate()
	{
		if (!this._connected)
		{
			return this.notConnected()
		}
		
		if (this.updateStatusBeforeTerminate)
		{
			const completion = this.status()
			if (completion !== 'completed' && completion !== 'passed')
			{
				this.set(this.isV1() ? 'cmi.core.exit' : 'cmi.exit', 'suspend')
			}
			else
			{
				this.set(this.isV1() ? 'cmi.core.exit' : 'cmi.exit', this.isV1() ? 'logout' : 'normal')
			}
		}
		
		this.save()
		
		const success = (this.isV1() ? this._api.LMSFinish('') : this._api.Terminate(''))
		if (!success)
		{
			console.warn('SCORM API Failed to connect! Error:', this.errorString(this.lastErrorCode()))
			return
		}
		
		this._connected = false
	}
	
	/**
	 * Gets or sets the lesson status
	 * If `status` is ommited, returns the lesson status. Sets the status otherwise.
	 * 
	 * @param {String} [status]
	 * 
	 * @returns {String|undefined} The status of the lesson
	 */
	status(status)
	{
		if (!this._connected)
		{
			return this.notConnected()
		}
		
		const cmi = (this.isV1() ? 'cmi.core.lesson_status' : 'cmi.completion_status')
		
		if (typeof status === 'undefined')
		{
			return this.get(cmi)
		}
		
		return this.set(cmi, status)
	}
	
	/**
	 * Gets a field from the API
	 * 
	 * @param {String} key The cmi key of the field
	 */
	get(key)
	{
		if (!this._connected)
		{
			return this.notConnected()
		}
		
		return (this.isV1() ? this._api.LMSGetValue(key) : this._api.GetValue(key))
	}
	
	/**
	 * Sets a field in the API
	 * 
	 * @param {String} key The cmi key of the field
	 * @param {any} value The value to persist. Any object passed here will be cast to string.
	 */
	set(key, value)
	{
		if (!this._connected)
		{
			return this.notConnected()
		}
		
		return (this.isV1() ? this._api.LMSSetValue(key, value) : this._api.SetValue(key, String(value)))
	}
	
	/**
	 * Persists/Commits the changes in the API
	 */
	save()
	{
		if (!this._connected)
		{
			return this.notConnected()
		}
		
		return (this.isV1() ? this._api.LMSCommit('') : this._api.Commit(''))
	}
	
	/**
	 * Gets the last error reported by the API
	 * 
	 * @returns {String} The error code
	 */
	lastErrorCode()
	{
		if (!this._connected)
		{
			return this.notConnected()
		}
		
		return (this.isV1() ? this._api.LMSGetLastError() : this._api.GetLastError())
	}
	
	/**
	 * Gets the text representation of the error code
	 * 
	 * @param {String} code
	 */
	errorString(code)
	{
		if (!this._connected)
		{
			return this.notConnected()
		}
		
		return (this.isV1() ? this._api.LMSGetErrorString(code.toString()) : this._api.GetErrorString(code.toString()))
	}

	/**
	 * True if selected version is SCORM 1.2
	 * 
	 * @protected
	 * 
	 * @returns {Boolean}
	 */
	isV1()
	{
		return this.version == SCORM.VERSION_1_2
	}

	/**
	 * True if selected version is SCORM 2004
	 * 
	 * @protected
	 *
	 * @returns {Boolean}
	 */
	isV2()
	{
		return this.version == SCORM.VERSION_2004
	}
	
	/**
	 * Standard error message when API isn't connected
	 * 
	 * @protected
	 */
	notConnected()
	{
		console.warn('SCORM API not connected')
		return null
	}
}

SCORM.VERSION_1_2 = '1.2'
SCORM.VERSION_2004 = '2004'
