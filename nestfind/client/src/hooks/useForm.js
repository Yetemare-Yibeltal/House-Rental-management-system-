// nestfind/nestfind/client/src/hooks/useForm.js

import { useState, useCallback } from "react";
import { validateForm } from "../utils/formValidation";

export const useForm = (initialValues = {}, validationRules = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked, files } = e.target;
      const fieldValue =
        type === "checkbox" ? checked : type === "file" ? files[0] : value;

      setValues((prev) => {
        const keys = name.split(".");
        if (keys.length === 1) return { ...prev, [name]: fieldValue };

        const updated = { ...prev };
        let current = updated;
        for (let i = 0; i < keys.length - 1; i++) {
          current[keys[i]] = { ...current[keys[i]] };
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = fieldValue;
        return updated;
      });

      setIsDirty(true);
      if (touched[name]) {
        validateField(name, fieldValue);
      }
    },
    [touched],
  );

  const handleBlur = useCallback(
    (e) => {
      const { name, value } = e.target;
      setTouched((prev) => ({ ...prev, [name]: true }));
      validateField(name, value);
    },
    [validationRules],
  );

  const validateField = useCallback(
    (name, value) => {
      if (!validationRules[name]) return;
      const { errors: fieldErrors } = validateForm(
        { [name]: value },
        { [name]: validationRules[name] },
      );
      setErrors((prev) => ({
        ...prev,
        [name]: fieldErrors[name] || null,
      }));
    },
    [validationRules],
  );

  const setValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
    setIsDirty(true);
  }, []);

  const setMultipleValues = useCallback((newValues) => {
    setValues((prev) => ({ ...prev, ...newValues }));
    setIsDirty(true);
  }, []);

  const setFieldError = useCallback((name, error) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const validate = useCallback(() => {
    if (Object.keys(validationRules).length === 0) return true;
    const { errors: validationErrors, isValid } = validateForm(
      values,
      validationRules,
    );
    setErrors(validationErrors);
    const allTouched = {};
    Object.keys(validationRules).forEach((key) => {
      allTouched[key] = true;
    });
    setTouched(allTouched);
    return isValid;
  }, [values, validationRules]);

  const reset = useCallback(
    (newValues = initialValues) => {
      setValues(newValues);
      setErrors({});
      setTouched({});
      setIsDirty(false);
      setIsSubmitting(false);
    },
    [initialValues],
  );

  const handleSubmit = useCallback(
    (onSubmit) => async (e) => {
      if (e && e.preventDefault) e.preventDefault();
      if (!validate()) return;
      setIsSubmitting(true);
      try {
        await onSubmit(values);
      } finally {
        setIsSubmitting(false);
      }
    },
    [validate, values],
  );

  const getFieldProps = useCallback(
    (name) => ({
      name,
      value: values[name] ?? "",
      onChange: handleChange,
      onBlur: handleBlur,
    }),
    [values, handleChange, handleBlur],
  );

  return {
    values,
    errors,
    touched,
    isDirty,
    isSubmitting,
    handleChange,
    handleBlur,
    setValue,
    setMultipleValues,
    setFieldError,
    validate,
    reset,
    handleSubmit,
    getFieldProps,
    setValues,
    setErrors,
  };
};
