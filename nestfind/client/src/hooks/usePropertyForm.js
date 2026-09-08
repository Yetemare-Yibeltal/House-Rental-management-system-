// nestfind/nestfind/client/src/hooks/usePropertyForm.js

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import propertyApi from "../api/propertyApi";
import landlordApi from "../api/landlordApi";
import { validatePropertyForm } from "../utils/formValidation";
import toast from "react-hot-toast";

const INITIAL_VALUES = {
  title: "",
  description: "",
  propertyType: "",
  location: {
    address: "",
    subCity: "",
    city: "Addis Ababa",
    region: "Addis Ababa",
  },
  details: {
    bedrooms: "",
    bathrooms: "",
    area: "",
    furnished: "",
    floorNumber: "",
    totalFloors: "",
    parkingSpaces: 0,
    yearBuilt: "",
  },
  pricing: {
    monthlyRent: "",
    securityDeposit: "",
    utilityBills: "excluded",
    negotiable: false,
  },
  leaseTerms: {
    minimumLease: 6,
    availableFrom: "",
    noticePeriod: 30,
  },
  amenities: {
    wifi: false,
    parking: false,
    generator: false,
    security24h: false,
    cctv: false,
    elevator: false,
    pool: false,
    gym: false,
    garden: false,
    balcony: false,
    airConditioning: false,
    waterTank: false,
    solarPower: false,
    petFriendly: false,
    childFriendly: false,
    laundry: false,
  },
};

export const usePropertyForm = (propertyId = null) => {
  const [values, setValues] = useState(INITIAL_VALUES);
  const [errors, setErrors] = useState({});
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [aiGenerating, setAIGenerating] = useState(false);
  const navigate = useNavigate();

  const totalSteps = 5;

  const setValue = useCallback((path, value) => {
    setValues((prev) => {
      const keys = path.split(".");
      if (keys.length === 1) return { ...prev, [path]: value };
      const updated = { ...prev };
      let current = updated;
      for (let i = 0; i < keys.length - 1; i++) {
        current[keys[i]] = { ...current[keys[i]] };
        current = current[keys[i]];
      }
      current[keys[keys.length - 1]] = value;
      return updated;
    });
  }, []);

  const toggleAmenity = useCallback((amenityKey) => {
    setValues((prev) => ({
      ...prev,
      amenities: {
        ...prev.amenities,
        [amenityKey]: !prev.amenities[amenityKey],
      },
    }));
  }, []);

  const handleImageSelect = useCallback((files) => {
    const fileArray = Array.from(files);
    const previews = fileArray.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));
    setImages((prev) => [...prev, ...fileArray]);
    setImagePreviews((prev) => [...prev, ...previews]);
  }, []);

  const removeImage = useCallback((index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  }, []);

  const validateStep = useCallback(
    (step) => {
      const stepValidations = {
        1: {
          title: values.title,
          description: values.description,
          propertyType: values.propertyType,
        },
        2: {
          "location.address": values.location.address,
          "location.subCity": values.location.subCity,
        },
        3: {
          "details.bedrooms": values.details.bedrooms,
          "details.bathrooms": values.details.bathrooms,
          "details.area": values.details.area,
          "details.furnished": values.details.furnished,
        },
        4: { "pricing.monthlyRent": values.pricing.monthlyRent },
        5: {},
      };

      const { errors: stepErrors, isValid } = validatePropertyForm(
        stepValidations[step] || {},
      );
      setErrors(stepErrors);
      return isValid;
    },
    [values],
  );

  const nextStep = useCallback(() => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, totalSteps));
    }
  }, [currentStep, validateStep]);

  const prevStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setErrors({});
  }, []);

  const generateAIDescription = useCallback(async () => {
    setAIGenerating(true);
    try {
      const response = await landlordApi.generateDescription({
        propertyDetails: {
          ...values,
          ...values.details,
          ...values.location,
        },
      });
      if (response.data.data.description) {
        setValue("description", response.data.data.description);
        if (response.data.data.suggestedTitle && !values.title) {
          setValue("title", response.data.data.suggestedTitle);
        }
        toast.success("AI description generated!");
      }
    } catch {
      toast.error("AI description generation failed");
    } finally {
      setAIGenerating(false);
    }
  }, [values, setValue]);

  const submit = useCallback(async () => {
    setLoading(true);
    try {
      let response;
      if (propertyId) {
        response = await propertyApi.updateProperty(propertyId, values);
        toast.success("Property updated successfully");
      } else {
        response = await propertyApi.createProperty(values);
        const newPropertyId = response.data.data.property._id;

        if (images.length > 0) {
          const formData = new FormData();
          images.forEach((img) => formData.append("images", img));
          await propertyApi.uploadImages(newPropertyId, formData);
        }
        toast.success("Property submitted for review");
      }

      navigate("/landlord/properties");
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message || "Failed to submit property";
      toast.error(message);
      return { success: false, error: message };
    } finally {
      setLoading(false);
    }
  }, [values, images, propertyId, navigate]);

  return {
    values,
    errors,
    currentStep,
    totalSteps,
    loading,
    images,
    imagePreviews,
    aiGenerating,
    setValue,
    toggleAmenity,
    handleImageSelect,
    removeImage,
    validateStep,
    nextStep,
    prevStep,
    generateAIDescription,
    submit,
    setValues,
  };
};
