import _ from "lodash";
import { isEmail, isEmpty } from './validators';
const moment = require("moment");

export function getKeyboardType(textType) {
    switch (textType) {
        case "email":
            return "email-address";

        case "number":
        case "phone":
        case "currency":
            return 'numeric';

        default:
            return "default";
    }
}

export function getDefaultValue(field) {
    switch (field.type) {
        case "text":
        case "number":
        case "email":
        case "password":
        case "url":
        case "phone":
        case "currency":
            return field.defaultValue || '';

        case "picker": {
            if ((field.options).indexOf(field.defaultValue) !== -1) {
                return field.defaultValue;
            }
            return field.options[0];
        }
        case "select": {
            if (Array.isArray(field.defaultValue)) {
                const selected = [];
                if (!field.objectType) {
                    field.defaultValue.forEach((item) => {
                        if ((field.options).indexOf(item) !== -1) {
                            selected.push(item);
                        }
                    });
                } else {
                    field.defaultValue.forEach((item) => {
                        if ((field.options).findIndex(option =>
                            option[field.primaryKey] === item[field.primaryKey]
                        ) !== -1) {
                            selected.push(item);
                        }
                    });
                }
                return selected;
            }
            if (!field.multiple) {
                return field.defaultValue || null;
            }
            return [];
        }
        case "switch":
            if (typeof field.defaultValue === 'boolean') {
                return field.defaultValue;
            }
            return false;

        case "date":
            {
                const dateDefaultValue = field.defaultValue && new Date(field.defaultValue);
                if (dateDefaultValue && !_.isNaN(dateDefaultValue.getTime())) {
                    return dateDefaultValue;
                }
                else if (field.defaultValue === "")
                    return "Select";

                else if (field.defaultValue === "today")
                    return moment().format("YYYY-MM-DD");

                else if (field.defaultValue === "tomorrow")
                    return moment().add(1, "day").format("YYYY-MM-DD");

                else
                    return null;
            }
        case "group":
            if (field.fields) {
                return field.defaultValue;
            }
            return null;
        default:
            return null;
    }
}

export function getResetValue(field) {
    switch (field.type) {
        case "text":
        case "number":
        case "email":
        case "password":
        case "url":
        case "phone":
        case "currency":
            return '';

        case "picker":
            return field.options[0];

        case "select":
            return field.multiple ? [] : null;

        case "switch":
            return false;

        case "date":
            return null;
            
        default:
            return null;
    }
}

export function getInitialState(fields) {
    const state = {};
    _.forEach(fields, (field) => {
        const fieldObj = field;
        fieldObj.error = false;
        fieldObj.errorMsg = '';
        if (!field.hidden && field.type) {
            fieldObj.value = getDefaultValue(field);
            state[field.name] = fieldObj;
        }
    });
    return state;
}

export function autoValidate(field) {
    let error = false;
    let errorMsg = '';
    if (field.required) {
        switch (field.type) {
            case "email":
                if (isEmpty(field.value)) {
                    error = true;
                    errorMsg = `${field.label} is required`;
                } else if (!isEmail(field.value)) {
                    error = true;
                    errorMsg = 'Please enter a valid email';
                }
                break;
            case "text":
            case "url":
            case "password":
                if (isEmpty(field.value)) {
                    error = true;
                    errorMsg = `${field.label} is required`;
                }
                break;
            case "number":
                if (field.type === "number") {
                    if (isEmpty(field.value)) {
                        error = true;
                        errorMsg = `${field.label} is required`;
                    } else if (isNaN(field.value)) {
                        errorMsg = `${field.label} should be a number`;
                    }
                }
                break;
            default:
        }
    }
    return { error, errorMsg };
}

export const getGeoLocation = (options, cb) => {

    let highAccuracySuccess = false
    let highAccuracyError = false
    let highAccuracy = !options || options.highAccuracy === undefined ? true : options.highAccuracy
    let timeout = !options || options.timeout === undefined ? 10000 : options.timeout

    let getLowAccuracyPosition = () => {
        console.log('REQUESTING POSITION', 'HIGH ACCURACY FALSE')
        navigator.geolocation.getCurrentPosition(
            position => {
                console.log('POSITION NETWORK OK', position)
                cb(position.coords)
            },
            error => {
                console.log(error)
                cb(null, error);
            },
            {
                enableHighAccuracy: false,
                timeout: 10000,
                maxAge: 0
            }
        )
    }

    if (highAccuracy) {
        console.log('REQUESTING POSITION', 'HIGH ACCURACY TRUE')
        const watchId = navigator.geolocation.watchPosition(
            position => {
                // location retrieved
                highAccuracySuccess = true
                console.log('POSITION GPS OK', position)
                navigator.geolocation.clearWatch(watchId)
                cb(position.coords)
            },
            error => {
                console.log(error)
                highAccuracyError = true
                navigator.geolocation.clearWatch(watchId)
                getLowAccuracyPosition()
            },
            {
                enableHighAccuracy: true,
                timeout: 20000,
                maxAge: 0,
                distanceFilter: 1
            }
        )

        setTimeout(() => {
            if (!highAccuracySuccess && !highAccuracyError) {
                getLowAccuracyPosition()
            }
        }, timeout)
    }
}