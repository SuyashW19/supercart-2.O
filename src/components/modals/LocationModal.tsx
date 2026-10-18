import React, { useState, useEffect, useRef, useCallback } from "react";
import { setOptions, importLibrary } from "@googlemaps/js-api-loader";
import {
  X,
  Crosshair,
  Search,
  MapPin,
  Home,
  Briefcase,
  Layers,
  Trash2,
  Check,
  AlertCircle,
  Compass,
  ArrowRight,
  Edit2,
  Loader2,
} from "lucide-react";
import { useLocation } from "../../context/LocationContext";
import { GOOGLE_MAPS_API_KEY } from "../../config";
import { Address } from "../../context/LocationContext";

// Complete list of Indian States and Union Territories
export const INDIAN_STATES_AND_UTS = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];

export interface GooglePlaceSuggestion {
  id: string;
  name: string;
  secondary: string;
  placeId?: string;
  lat?: number;
  lng?: number;
}

export const LocationModal: React.FC = () => {
  const {
    currentAddress,
    savedAddresses,
    isLocationModalOpen,
    setIsLocationModalOpen,
    selectAddress,
    addAddress,
    deleteAddress,
  } = useLocation();

  // Map state
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markerInstanceRef = useRef<google.maps.Marker | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const autocompleteServiceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(null);

  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapTypeId, setMapTypeId] = useState<"satellite" | "roadmap">("satellite");
  const [isPinInView, setIsPinInView] = useState(true);

  // Form Fields (Starts strictly EMPTY)
  const [houseNo, setHouseNo] = useState("");
  const [street, setStreet] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");
  const [receiverName, setReceiverName] = useState("");
  const [receiverPhone, setReceiverPhone] = useState("");

  // Validation errors
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  // Pin & Geocoding Coordinates State
  const [pinLat, setPinLat] = useState<number | null>(null);
  const [pinLng, setPinLng] = useState<number | null>(null);
  const [hasPin, setHasPin] = useState(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<GooglePlaceSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchNoResults, setSearchNoResults] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchBoxContainerRef = useRef<HTMLDivElement>(null);
  const searchDebounceTimerRef = useRef<any>(null);

  // Geolocation state
  const [isDetectingGps, setIsDetectingGps] = useState(false);
  const [gpsErrorMsg, setGpsErrorMsg] = useState<string | null>(null);

  // Step B Confirmation Popup State
  const [showConfirmPopup, setShowConfirmPopup] = useState(false);
  const [addressConfirmed, setAddressConfirmed] = useState(false);

  // Step D Save Address Preferences
  const [label, setLabel] = useState<"Home" | "Work" | "Other">("Home");
  const [customLabel, setCustomLabel] = useState("");
  const [saveForNextTime, setSaveForNextTime] = useState(true);

  // Status / Toast messages
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<"success" | "info" | "warning">("info");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const showToast = (msg: string, type: "success" | "info" | "warning" = "info", duration = 3500) => {
    setToastMessage(msg);
    setToastType(type);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, duration);
  };

  // Form validity check (House, Street, City, State, valid 6-digit Pincode)
  const isPincodeValid = /^[1-8][0-9]{5}$/.test(pincode.trim());
  const isFormValid =
    houseNo.trim().length > 0 &&
    street.trim().length > 0 &&
    city.trim().length > 0 &&
    stateName.trim().length > 0 &&
    isPincodeValid;

  // Validate on change
  const validateForm = () => {
    const errs: { [key: string]: string } = {};
    if (!houseNo.trim()) errs.houseNo = "House / Flat / Building no. is required";
    if (!street.trim()) errs.street = "Street / Area / Colony is required";
    if (!city.trim()) errs.city = "City / Village is required";
    if (!stateName.trim()) errs.stateName = "State is required";
    if (!pincode.trim()) {
      errs.pincode = "Pincode is required";
    } else if (!isPincodeValid) {
      errs.pincode = "Enter a valid 6-digit Indian pincode (first digit 1-8)";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Build clean display address block
  const fullAddressString = [
    houseNo.trim(),
    street.trim(),
    landmark.trim(),
    city.trim(),
    stateName.trim() ? `${stateName.trim()} ${pincode.trim()}` : pincode.trim(),
  ]
    .filter(Boolean)
    .join(", ");

  // Create standard standard red Google Maps draggable pin
  const placeOrUpdateMarker = useCallback(
    (latitude: number, longitude: number, zoomLevel = 17) => {
      const map = mapInstanceRef.current;
      if (!map) return;

      const position = new google.maps.LatLng(latitude, longitude);

      if (!markerInstanceRef.current) {
        const marker = new google.maps.Marker({
          position,
          map,
          draggable: true,
          title: "Drag to fine-tune exact doorstep",
          animation: google.maps.Animation.DROP,
        });

        // Dragging updates ONLY lat/lng without overwriting user-typed text
        marker.addListener("dragend", (event: google.maps.MapMouseEvent) => {
          if (event.latLng) {
            setPinLat(event.latLng.lat());
            setPinLng(event.latLng.lng());
            setHasPin(true);
          }
        });

        markerInstanceRef.current = marker;
      } else {
        markerInstanceRef.current.setPosition(position);
        markerInstanceRef.current.setMap(map);
      }

      setPinLat(latitude);
      setPinLng(longitude);
      setHasPin(true);
      map.panTo(position);
      if (zoomLevel) map.setZoom(zoomLevel);
    },
    []
  );

  // Initialize Map: starts centred on India (zoom 5) with NO pin
  const initGoogleMap = useCallback(async () => {
    if (!mapContainerRef.current) return;

    try {
      setOptions({
        key: GOOGLE_MAPS_API_KEY,
        v: "weekly",
      });

      await importLibrary("maps");
      await importLibrary("places");
      await importLibrary("geocoding");

      if (!mapInstanceRef.current && mapContainerRef.current) {
        const map = new google.maps.Map(mapContainerRef.current, {
          center: { lat: 20.5937, lng: 78.9629 }, // Center of India
          zoom: 5,
          mapTypeId: mapTypeId === "satellite" ? google.maps.MapTypeId.SATELLITE : google.maps.MapTypeId.ROADMAP,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          rotateControl: false,
          clickableIcons: false,
          zoomControl: false,
          gestureHandling: "greedy",
        });

        // Clicking anywhere on map moves pin to exact point
        map.addListener("click", (e: google.maps.MapMouseEvent) => {
          if (e.latLng) {
            const clickLat = e.latLng.lat();
            const clickLng = e.latLng.lng();
            placeOrUpdateMarker(clickLat, clickLng, map.getZoom() || 16);
          }
        });

        // Track if pin is within current map bounds
        map.addListener("bounds_changed", () => {
          if (markerInstanceRef.current && map.getBounds()) {
            const pos = markerInstanceRef.current.getPosition();
            if (pos) {
              setIsPinInView(map.getBounds()!.contains(pos));
            }
          }
        });

        mapInstanceRef.current = map;
        geocoderRef.current = new google.maps.Geocoder();
        autocompleteServiceRef.current = new google.maps.places.AutocompleteService();
        placesServiceRef.current = new google.maps.places.PlacesService(map);
      }

      setMapLoaded(true);
    } catch (err) {
      console.warn("Failed to load Google Maps JS API:", err);
      setMapLoaded(false);
    }
  }, [mapTypeId, placeOrUpdateMarker]);

  // Modal resets completely fresh on every open
  useEffect(() => {
    if (isLocationModalOpen) {
      // Clear all fields and state completely
      setHouseNo("");
      setStreet("");
      setLandmark("");
      setCity("");
      setStateName("");
      setPincode("");
      setReceiverName("");
      setReceiverPhone("");
      setErrors({});
      setPinLat(null);
      setPinLng(null);
      setHasPin(false);
      setSearchQuery("");
      setSuggestions([]);
      setShowDropdown(false);
      setSearchNoResults(false);
      setGpsErrorMsg(null);
      setShowConfirmPopup(false);
      setAddressConfirmed(false);
      setLabel("Home");
      setCustomLabel("");
      setSaveForNextTime(true);

      const timer = setTimeout(() => {
        initGoogleMap();
      }, 100);
      return () => clearTimeout(timer);
    } else {
      if (markerInstanceRef.current) {
        markerInstanceRef.current.setMap(null);
        markerInstanceRef.current = null;
      }
      mapInstanceRef.current = null;
      setMapLoaded(false);
    }
  }, [isLocationModalOpen, initGoogleMap]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchBoxContainerRef.current &&
        !searchBoxContainerRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Map toggle between Satellite and Roadmap
  const handleToggleMapType = () => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const nextType = mapTypeId === "satellite" ? "roadmap" : "satellite";
    map.setMapTypeId(
      nextType === "satellite" ? google.maps.MapTypeId.SATELLITE : google.maps.MapTypeId.ROADMAP
    );
    setMapTypeId(nextType);
  };

  // Pan back to pin button
  const handleBackToPin = () => {
    if (mapInstanceRef.current && pinLat !== null && pinLng !== null) {
      mapInstanceRef.current.panTo(new google.maps.LatLng(pinLat, pinLng));
      mapInstanceRef.current.setZoom(17);
      setIsPinInView(true);
    }
  };

  // Offer optional reverse-geocoding link: "Update address from pin"
  const handleUpdateAddressFromPin = () => {
    if (pinLat === null || pinLng === null) return;
    setIsReverseGeocoding(true);

    if (!geocoderRef.current) {
      geocoderRef.current = new google.maps.Geocoder();
    }

    geocoderRef.current.geocode({ location: { lat: pinLat, lng: pinLng } }, (results, status) => {
      setIsReverseGeocoding(false);
      if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
        const comp = results[0].address_components || [];
        let dArea = "";
        let dCity = "";
        let dState = "";
        let dPin = "";

        for (const c of comp) {
          if (c.types.includes("sublocality") || c.types.includes("neighborhood")) {
            if (!dArea) dArea = c.long_name;
          } else if (c.types.includes("locality")) {
            dCity = c.long_name;
          } else if (c.types.includes("administrative_area_level_1")) {
            dState = c.long_name;
          } else if (c.types.includes("postal_code")) {
            dPin = c.long_name.replace(/\D/g, "").slice(0, 6);
          }
        }

        if (dArea && !street) setStreet(dArea);
        if (dCity) setCity(dCity);
        if (dState && INDIAN_STATES_AND_UTS.includes(dState)) setStateName(dState);
        if (dPin && /^[1-8][0-9]{5}$/.test(dPin)) setPincode(dPin);
        showToast("Address fields updated from pin coordinates", "success");
      }
    });
  };

  // SEARCH: Google Places Autocomplete restricted to India
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setSearchNoResults(false);

    if (searchDebounceTimerRef.current) {
      clearTimeout(searchDebounceTimerRef.current);
    }

    const trimmed = val.trim();
    if (!trimmed) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    searchDebounceTimerRef.current = setTimeout(() => {
      setIsSearching(true);

      // Check if user entered a 6-digit pincode directly
      if (/^[1-8][0-9]{5}$/.test(trimmed)) {
        if (!geocoderRef.current) geocoderRef.current = new google.maps.Geocoder();
        geocoderRef.current.geocode(
          { address: `${trimmed}, India`, componentRestrictions: { country: "IN" } },
          (results, status) => {
            setIsSearching(false);
            if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
              const r = results[0];
              const list: GooglePlaceSuggestion[] = [
                {
                  id: `pin-${trimmed}`,
                  name: `Pincode ${trimmed}`,
                  secondary: r.formatted_address,
                  lat: r.geometry.location.lat(),
                  lng: r.geometry.location.lng(),
                },
              ];
              setSuggestions(list);
              setShowDropdown(true);
              setSearchNoResults(false);
            } else {
              setSuggestions([]);
              setSearchNoResults(true);
              setShowDropdown(true);
            }
          }
        );
        return;
      }

      if (autocompleteServiceRef.current) {
        autocompleteServiceRef.current.getPlacePredictions(
          {
            input: trimmed,
            componentRestrictions: { country: "in" },
          },
          (predictions, status) => {
            setIsSearching(false);
            if (
              status === google.maps.places.PlacesServiceStatus.OK &&
              predictions &&
              predictions.length > 0
            ) {
              // Deduplicate and filter out near-duplicates and pure district/taluka entries unless typed
              const filtered = predictions
                .filter((p) => {
                  const main = p.structured_formatting.main_text.toLowerCase();
                  if (
                    (main.includes("district") || main.includes("taluka")) &&
                    !trimmed.toLowerCase().includes("district") &&
                    !trimmed.toLowerCase().includes("taluka")
                  ) {
                    return false;
                  }
                  return true;
                })
                .slice(0, 5)
                .map((p) => ({
                  id: p.place_id,
                  name: p.structured_formatting.main_text,
                  secondary: p.structured_formatting.secondary_text || "",
                  placeId: p.place_id,
                }));

              if (filtered.length > 0) {
                setSuggestions(filtered);
                setSearchNoResults(false);
                setShowDropdown(true);
              } else {
                setSuggestions([]);
                setSearchNoResults(true);
                setShowDropdown(true);
              }
            } else {
              setSuggestions([]);
              setSearchNoResults(true);
              setShowDropdown(true);
            }
          }
        );
      }
    }, 300);
  };

  // Picking search suggestion moves map (zoom 16) and pre-fills ONLY City, State, Pincode
  const handleSelectSuggestion = (item: GooglePlaceSuggestion) => {
    setShowDropdown(false);
    setSearchQuery("");

    if (item.placeId && placesServiceRef.current) {
      placesServiceRef.current.getDetails(
        { placeId: item.placeId, fields: ["geometry", "formatted_address", "address_components", "name"] },
        (place, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();

            let dCity = "";
            let dState = "";
            let dPin = "";

            (place.address_components || []).forEach((c) => {
              if (c.types.includes("locality")) dCity = c.long_name;
              else if (c.types.includes("administrative_area_level_1")) dState = c.long_name;
              else if (c.types.includes("postal_code")) dPin = c.long_name.replace(/\D/g, "").slice(0, 6);
            });

            if (dCity) setCity(dCity);
            if (dState && INDIAN_STATES_AND_UTS.includes(dState)) setStateName(dState);
            if (dPin && /^[1-8][0-9]{5}$/.test(dPin)) setPincode(dPin);

            placeOrUpdateMarker(lat, lng, 16);
            showToast("Area selected on map. Enter your house number & street to confirm.", "info");
          }
        }
      );
    } else if (item.lat && item.lng) {
      placeOrUpdateMarker(item.lat, item.lng, 16);
      if (/^[1-8][0-9]{5}$/.test(item.name.replace(/\D/g, ""))) {
        setPincode(item.name.replace(/\D/g, "").slice(0, 6));
      }
    }
  };

  // CURRENT LOCATION handler
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setGpsErrorMsg("Geolocation is not supported by your browser. Please enter your address below.");
      return;
    }

    setIsDetectingGps(true);
    setGpsErrorMsg(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsDetectingGps(false);
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        placeOrUpdateMarker(lat, lng, 17);

        // Reverse geocode and PRE-FILL form fields for user to review
        if (!geocoderRef.current) geocoderRef.current = new google.maps.Geocoder();
        geocoderRef.current.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
            const comp = results[0].address_components || [];
            let dHouse = "";
            let dStreet = "";
            let dCity = "";
            let dState = "";
            let dPin = "";

            for (const c of comp) {
              if (c.types.includes("premise") || c.types.includes("subpremise") || c.types.includes("street_number")) {
                dHouse = c.long_name;
              } else if (c.types.includes("route") || c.types.includes("sublocality") || c.types.includes("neighborhood")) {
                if (!dStreet) dStreet = c.long_name;
              } else if (c.types.includes("locality")) {
                dCity = c.long_name;
              } else if (c.types.includes("administrative_area_level_1")) {
                dState = c.long_name;
              } else if (c.types.includes("postal_code")) {
                dPin = c.long_name.replace(/\D/g, "").slice(0, 6);
              }
            }

            if (dHouse) setHouseNo(dHouse);
            if (dStreet) setStreet(dStreet);
            if (dCity) setCity(dCity);
            if (dState && INDIAN_STATES_AND_UTS.includes(dState)) setStateName(dState);
            if (dPin && /^[1-8][0-9]{5}$/.test(dPin)) setPincode(dPin);

            showToast("Current location detected! Review address details below.", "success");
          }
        });
      },
      (error) => {
        setIsDetectingGps(false);
        if (error.code === error.PERMISSION_DENIED) {
          setGpsErrorMsg("Location permission was denied. You can enter your delivery address below.");
        } else if (error.code === error.TIMEOUT) {
          setGpsErrorMsg("Location request timed out. Please enter your address manually.");
        } else {
          setGpsErrorMsg("Location is currently unavailable. Please enter your address manually.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      }
    );
  };

  // STEP A: User types address and clicks "Confirm Address"
  const handleInitiateConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    // Opens confirmation popup (Step B)
    setShowConfirmPopup(true);
  };

  // STEP C: User clicks "Yes, Confirm" in popup -> TRACE on map with geocoding cascade
  const handleYesConfirmAddress = async () => {
    setShowConfirmPopup(false);

    if (!geocoderRef.current) {
      geocoderRef.current = new google.maps.Geocoder();
    }

    const geocoder = geocoderRef.current;
    let foundLat: number | null = null;
    let foundLng: number | null = null;
    let matchQuality: "exact" | "area" | "none" = "none";

    // Cascade 1: Full typed address with India
    const q1 = `${houseNo.trim()}, ${street.trim()}, ${landmark.trim()}, ${city.trim()}, ${stateName.trim()} ${pincode.trim()}, India`;
    const res1 = await new Promise<any>((resolve) => {
      geocoder.geocode({ address: q1, componentRestrictions: { country: "IN" } }, (r, s) => {
        resolve(s === google.maps.GeocoderStatus.OK && r && r[0] ? r[0] : null);
      });
    });

    if (res1) {
      foundLat = res1.geometry.location.lat();
      foundLng = res1.geometry.location.lng();
      matchQuality = "exact";
    } else {
      // Cascade 2: Street, City, Pincode
      const q2 = `${street.trim()}, ${city.trim()}, ${pincode.trim()}, India`;
      const res2 = await new Promise<any>((resolve) => {
        geocoder.geocode({ address: q2, componentRestrictions: { country: "IN" } }, (r, s) => {
          resolve(s === google.maps.GeocoderStatus.OK && r && r[0] ? r[0] : null);
        });
      });

      if (res2) {
        foundLat = res2.geometry.location.lat();
        foundLng = res2.geometry.location.lng();
        matchQuality = "area";
      } else {
        // Cascade 3: Pincode, India
        const q3 = `${pincode.trim()}, India`;
        const res3 = await new Promise<any>((resolve) => {
          geocoder.geocode({ address: q3, componentRestrictions: { country: "IN" } }, (r, s) => {
            resolve(s === google.maps.GeocoderStatus.OK && r && r[0] ? r[0] : null);
          });
        });

        if (res3) {
          foundLat = res3.geometry.location.lat();
          foundLng = res3.geometry.location.lng();
          matchQuality = "area";
        }
      }
    }

    if (foundLat !== null && foundLng !== null) {
      placeOrUpdateMarker(foundLat, foundLng, 17);
      if (matchQuality === "exact") {
        showToast("Location found on map", "success");
      } else {
        showToast("We found your area. Drag the pin to your exact doorstep.", "info", 5000);
      }
    } else {
      // If nothing found on map, fallback to keeping coordinates if pin already placed
      if (pinLat === null || pinLng === null) {
        showToast("We couldn't locate this on the map. Tap the map to place your pin.", "warning", 5000);
      } else {
        showToast("Address confirmed. Fine-tune your pin on the map if needed.", "info");
      }
    }

    // Step D: Show "Save address as" section and activate final delivery button
    setAddressConfirmed(true);
  };

  // STEP E: Final "Confirm & Deliver Here" button
  const handleFinalConfirmAndDeliver = async () => {
    if (!addressConfirmed || pinLat === null || pinLng === null) return;

    setIsSubmitting(true);
    const chosenLabel = (label === "Home" || label === "Work" ? label : "Other") as "Home" | "Work" | "Other";

    try {
      if (saveForNextTime) {
        await addAddress({
          label: chosenLabel,
          receiver_name: receiverName.trim(),
          receiver_phone: receiverPhone.trim(),
          house_no: houseNo.trim(),
          street: street.trim(),
          landmark: landmark.trim() || undefined,
          area: street.trim() || city.trim(),
          city: city.trim(),
          state: stateName.trim(),
          pincode: pincode.trim(),
          lat: pinLat,
          lng: pinLng,
          is_default: true,
        });
      } else {
        // Update current address context for session without saving
        selectAddress({
          id: "addr_temp_" + Date.now(),
          label: chosenLabel,
          receiver_name: receiverName.trim(),
          receiver_phone: receiverPhone.trim(),
          house_no: houseNo.trim(),
          street: street.trim(),
          landmark: landmark.trim() || undefined,
          area: street.trim() || city.trim(),
          city: city.trim(),
          state: stateName.trim(),
          pincode: pincode.trim(),
          lat: pinLat,
          lng: pinLng,
          is_default: true,
        });
      }

      showToast(`Delivering to ${city.trim() || "your address"}!`, "success");
      setTimeout(() => {
        setIsLocationModalOpen(false);
      }, 400);
    } catch (err) {
      console.error("Failed to finalize delivery location:", err);
      setIsLocationModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Tapping a saved address fills form and traces on map
  const handleSelectSavedAddress = (saved: Address) => {
    setHouseNo(saved.house_no || "");
    setStreet(saved.street || saved.area || "");
    setLandmark(saved.landmark || "");
    setCity(saved.city || "");
    setStateName(saved.state || "Maharashtra");
    setPincode(saved.pincode || "");
    setReceiverName(saved.receiver_name || "");
    setReceiverPhone(saved.receiver_phone || "");
    setLabel((saved.label as any) || "Home");

    if (saved.lat && saved.lng) {
      placeOrUpdateMarker(saved.lat, saved.lng, 17);
    }
    setAddressConfirmed(true);
    showToast(`Loaded saved address: ${saved.label}`, "info");
  };

  if (!isLocationModalOpen) return null;

  // Filter valid saved addresses (only if genuinely present)
  const confirmedSavedList = savedAddresses.filter(
    (a) => a.pincode && a.pincode.trim().length === 6 && a.area && a.area.trim() !== ""
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="location-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      {/* DARK THEMED MODAL CONTAINER */}
      <div className="relative w-full sm:max-w-2xl bg-slate-950 text-slate-100 rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-slate-800 flex flex-col h-[94vh] sm:h-auto sm:max-h-[92vh] overflow-hidden">
        {/* Toast status banner */}
        {toastMessage && (
          <div
            className={`absolute top-3 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-2xl flex items-center gap-2 animate-in slide-in-from-top duration-200 max-w-[90%] text-center ${
              toastType === "success"
                ? "bg-emerald-600 text-white"
                : toastType === "warning"
                ? "bg-amber-600 text-white"
                : "bg-slate-800 border border-slate-700 text-emerald-400"
            }`}
          >
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/80 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
              <MapPin className="w-4 h-4 fill-emerald-400/20" />
            </div>
            <h2
              id="location-modal-title"
              className="text-base sm:text-lg font-black text-white tracking-tight"
            >
              Select Delivery Location
            </h2>
          </div>
          <button
            onClick={() => setIsLocationModalOpen(false)}
            aria-label="Close modal"
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm flex-1">
          {/* SECTION 1: "Use Current Location" button & Search Box */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isDetectingGps}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 font-bold border border-emerald-500/30 hover:border-emerald-500/60 shadow-md active:scale-98 transition-all cursor-pointer"
            >
              <Crosshair className={`w-4 h-4 ${isDetectingGps ? "animate-spin" : ""}`} />
              <span>
                {isDetectingGps ? "Detecting Location..." : "Use Current Location"}
              </span>
            </button>

            {/* GPS Error notification */}
            {gpsErrorMsg && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-200">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="flex-1 leading-relaxed">{gpsErrorMsg}</span>
                <button
                  type="button"
                  onClick={() => setGpsErrorMsg(null)}
                  className="text-amber-400 hover:text-amber-200 font-bold"
                >
                  ✕
                </button>
              </div>
            )}

            {/* Search Box with Autocomplete */}
            <div ref={searchBoxContainerRef} className="relative">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => {
                    if (suggestions.length > 0) setShowDropdown(true);
                  }}
                  placeholder="Search locality, landmark, or 6-digit pincode in India..."
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-hidden transition-all shadow-inner"
                />
                {isSearching && (
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                  </div>
                )}
                {searchQuery && !isSearching && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery("");
                      setSuggestions([]);
                      setShowDropdown(false);
                      setSearchNoResults(false);
                    }}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Suggestions Dropdown */}
              {showDropdown && suggestions.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-slate-900 rounded-xl shadow-2xl border border-slate-800 overflow-hidden max-h-56 overflow-y-auto">
                  {suggestions.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(s)}
                      className="w-full px-3.5 py-2.5 text-left border-b last:border-b-0 border-slate-800/60 hover:bg-slate-800/80 transition-colors flex items-start gap-2.5 cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs sm:text-sm text-white truncate">
                          {s.name}
                        </div>
                        {s.secondary && (
                          <div className="text-[11px] text-slate-400 truncate">
                            {s.secondary}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {searchNoResults && (
                <div className="mt-1 px-3 py-2 text-xs text-amber-300 bg-amber-950/40 rounded-lg border border-amber-800/50">
                  No exact match found. Try a nearby area or pincode.
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: Saved Addresses Row (Shown ONLY if user has genuine saved addresses) */}
          {confirmedSavedList.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Saved Addresses
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
                {confirmedSavedList.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => handleSelectSavedAddress(addr)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 cursor-pointer shrink-0 transition-colors"
                  >
                    <div className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                      {addr.label === "Home" ? (
                        <Home className="w-3 h-3" />
                      ) : addr.label === "Work" ? (
                        <Briefcase className="w-3 h-3" />
                      ) : (
                        <MapPin className="w-3 h-3" />
                      )}
                    </div>
                    <div className="text-left">
                      <span className="font-bold text-xs text-white block">
                        {addr.label}
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate max-w-[130px]">
                        {addr.area}, {addr.city}
                      </span>
                    </div>
                    <button
                      type="button"
                      title="Delete saved address"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteAddress(addr.id);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3: The Map (Fixed height 300px desktop, 240px mobile) */}
          <div className="relative w-full h-[240px] sm:h-[300px] rounded-2xl overflow-hidden border border-slate-800 shadow-inner bg-slate-900 select-none">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Satellite / Map Toggle Switch */}
            {mapLoaded && (
              <div className="absolute top-2.5 right-2.5 z-20 flex flex-col gap-1.5">
                <button
                  type="button"
                  onClick={handleToggleMapType}
                  title="Toggle Satellite / Map"
                  className="px-2.5 py-1.5 rounded-lg bg-slate-950/90 hover:bg-slate-900 text-white text-xs font-semibold backdrop-blur-xs border border-white/20 shadow-md flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Layers className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-[10px] capitalize">{mapTypeId}</span>
                </button>
              </div>
            )}

            {/* "Back to Pin" button if pin leaves the viewport */}
            {hasPin && !isPinInView && (
              <button
                type="button"
                onClick={handleBackToPin}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 px-3 py-1.5 rounded-full bg-slate-900/95 text-emerald-400 hover:text-white border border-emerald-500/50 shadow-lg text-xs font-bold flex items-center gap-1.5 backdrop-blur-xs transition-all cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5 animate-spin" />
                <span>Back to pin</span>
              </button>
            )}
          </div>

          {/* Pin update helper text & reverse geocode link */}
          {hasPin && (
            <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
              <span>Pin dropped on map. Drag anytime to fine-tune.</span>
              <button
                type="button"
                onClick={handleUpdateAddressFromPin}
                disabled={isReverseGeocoding}
                className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
              >
                {isReverseGeocoding ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <MapPin className="w-3 h-3" />
                )}
                <span>Update address from pin</span>
              </button>
            </div>
          )}

          {/* SECTION 4: Card "Enter your delivery address" */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3.5">
            <div className="flex items-center justify-between pb-1 border-b border-slate-800">
              <h3 className="font-bold text-sm text-white">Enter your delivery address</h3>
              <span className="text-[11px] text-slate-400">* Required</span>
            </div>

            <form onSubmit={handleInitiateConfirm} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {/* House / Flat no */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    House / Flat / Building no. *
                  </label>
                  <input
                    type="text"
                    value={houseNo}
                    onChange={(e) => {
                      setHouseNo(e.target.value);
                      if (errors.houseNo) setErrors((prev) => ({ ...prev, houseNo: "" }));
                    }}
                    placeholder="e.g. Flat 301, Tower B"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-hidden transition-colors ${
                      errors.houseNo
                        ? "border-rose-500 focus:border-rose-500"
                        : "border-slate-800 focus:border-emerald-500"
                    }`}
                  />
                  {errors.houseNo && (
                    <p className="text-[10px] text-rose-400 mt-0.5">{errors.houseNo}</p>
                  )}
                </div>

                {/* Street / Area / Colony */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Street / Area / Colony *
                  </label>
                  <input
                    type="text"
                    value={street}
                    onChange={(e) => {
                      setStreet(e.target.value);
                      if (errors.street) setErrors((prev) => ({ ...prev, street: "" }));
                    }}
                    placeholder="e.g. MG Road, Near Market"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-hidden transition-colors ${
                      errors.street
                        ? "border-rose-500 focus:border-rose-500"
                        : "border-slate-800 focus:border-emerald-500"
                    }`}
                  />
                  {errors.street && (
                    <p className="text-[10px] text-rose-400 mt-0.5">{errors.street}</p>
                  )}
                </div>

                {/* Landmark (Optional) */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    type="text"
                    value={landmark}
                    onChange={(e) => setLandmark(e.target.value)}
                    placeholder="e.g. Behind Metro Station"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                {/* City / Village */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    City / Village *
                  </label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => {
                      setCity(e.target.value);
                      if (errors.city) setErrors((prev) => ({ ...prev, city: "" }));
                    }}
                    placeholder="e.g. Pune, Mumbai, Delhi"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-hidden transition-colors ${
                      errors.city
                        ? "border-rose-500 focus:border-rose-500"
                        : "border-slate-800 focus:border-emerald-500"
                    }`}
                  />
                  {errors.city && (
                    <p className="text-[10px] text-rose-400 mt-0.5">{errors.city}</p>
                  )}
                </div>

                {/* State Dropdown */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    State / UT *
                  </label>
                  <select
                    value={stateName}
                    onChange={(e) => {
                      setStateName(e.target.value);
                      if (errors.stateName) setErrors((prev) => ({ ...prev, stateName: "" }));
                    }}
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs sm:text-sm text-white focus:outline-hidden transition-colors ${
                      errors.stateName
                        ? "border-rose-500 focus:border-rose-500"
                        : "border-slate-800 focus:border-emerald-500"
                    }`}
                  >
                    <option value="">Select State or Union Territory</option>
                    {INDIAN_STATES_AND_UTS.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                  {errors.stateName && (
                    <p className="text-[10px] text-rose-400 mt-0.5">{errors.stateName}</p>
                  )}
                </div>

                {/* Pincode */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Pincode (6 Digits) *
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={pincode}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setPincode(val);
                      if (errors.pincode) setErrors((prev) => ({ ...prev, pincode: "" }));
                    }}
                    placeholder="e.g. 411045"
                    className={`w-full px-3 py-2 bg-slate-950 border rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:outline-hidden transition-colors ${
                      errors.pincode
                        ? "border-rose-500 focus:border-rose-500"
                        : "border-slate-800 focus:border-emerald-500"
                    }`}
                  />
                  {errors.pincode && (
                    <p className="text-[10px] text-rose-400 mt-0.5">{errors.pincode}</p>
                  )}
                </div>

                {/* Optional Receiver Details */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Receiver Name (Optional)
                  </label>
                  <input
                    type="text"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    placeholder="e.g. Customer Name"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Receiver Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    placeholder="e.g. +91 98230 12345"
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              {/* Confirm Address Button (Step A) */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={!isFormValid}
                  className={`w-full py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all ${
                    isFormValid
                      ? "bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer active:scale-98"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed"
                  }`}
                >
                  <span>Confirm Address</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </form>

            {/* SECTION D: "Save address as" section (Visible once address confirmed) */}
            {addressConfirmed && (
              <div className="pt-3 border-t border-slate-800 space-y-3 animate-in fade-in duration-200">
                <div>
                  <span className="block text-[11px] font-semibold text-slate-400 mb-1.5">
                    Save address as
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {(["Home", "Work", "Other"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setLabel(t)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                          label === t
                            ? "bg-emerald-600 text-white border-emerald-500 shadow-xs"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {t === "Home" && <Home className="w-3.5 h-3.5" />}
                        {t === "Work" && <Briefcase className="w-3.5 h-3.5" />}
                        {t === "Other" && <MapPin className="w-3.5 h-3.5" />}
                        <span>{t}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* "Other" reveals optional custom name field */}
                {label === "Other" && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      Custom Address Name
                    </label>
                    <input
                      type="text"
                      value={customLabel}
                      onChange={(e) => setCustomLabel(e.target.value)}
                      placeholder="e.g. Mom's House, Gym, Studio"
                      className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:border-emerald-500 focus:outline-hidden"
                    />
                  </div>
                )}

                {/* Checkbox "Save this address for next time" (on by default) */}
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={saveForNextTime}
                    onChange={(e) => setSaveForNextTime(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-slate-950 border-slate-700"
                  />
                  <span>Save this address for next time</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Modal Sticky Footer */}
        <div className="px-5 py-3.5 border-t border-slate-800/80 bg-slate-900/95 flex items-center justify-between gap-3 shrink-0">
          {/* Footer pincode text: shows ONLY selected pin's pincode, nothing when none */}
          <div className="text-xs text-slate-400">
            {hasPin && pincode ? (
              <span className="font-mono text-emerald-400 font-bold">
                PIN: {pincode}
              </span>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsLocationModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-800 text-slate-400 font-semibold text-xs hover:bg-slate-800 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>

            {/* "Confirm & Deliver Here" button: disabled until address confirmed & pin exists */}
            <button
              type="button"
              onClick={handleFinalConfirmAndDeliver}
              disabled={!addressConfirmed || !hasPin || isSubmitting}
              className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs sm:text-sm shadow-lg transition-all ${
                addressConfirmed && hasPin && !isSubmitting
                  ? "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/25 active:scale-98 cursor-pointer"
                  : "bg-slate-800 text-slate-500 cursor-not-allowed shadow-none"
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Saving...</span>
                </>
              ) : (
                <span>Confirm & Deliver Here</span>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* STEP B: "Confirm your address" Confirmation Popup Modal */}
      {showConfirmPopup && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in"
        >
          <div className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl p-5 space-y-4 text-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-black text-base text-white">Confirm your address</h3>
              <button
                onClick={() => setShowConfirmPopup(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Neat formatted address block */}
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800/80 space-y-1.5 text-xs sm:text-sm">
              <div className="font-bold text-white">{houseNo.trim()}</div>
              <div className="text-slate-300">{street.trim()}</div>
              {landmark.trim() && (
                <div className="text-slate-400 text-xs">Landmark: {landmark.trim()}</div>
              )}
              <div className="text-slate-200">
                {city.trim()}, {stateName.trim()} -{" "}
                <span className="font-mono font-bold text-emerald-400">{pincode.trim()}</span>
              </div>
              {(receiverName.trim() || receiverPhone.trim()) && (
                <div className="pt-1.5 border-t border-slate-800 text-xs text-slate-400">
                  Receiver: {receiverName.trim() || "Customer"}{" "}
                  {receiverPhone.trim() ? `(${receiverPhone.trim()})` : ""}
                </div>
              )}
            </div>

            {/* Actions: Edit and Yes, Confirm */}
            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setShowConfirmPopup(false)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-800 text-slate-300 font-semibold text-xs hover:bg-slate-900 transition-colors cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit</span>
              </button>

              <button
                type="button"
                onClick={handleYesConfirmAddress}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Yes, Confirm</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
