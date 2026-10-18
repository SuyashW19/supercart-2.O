import React, { createContext, useContext, useState, useEffect } from "react";
import { Address, ServiceablePincode, BlockedPincode } from "../types";
import { SERVICEABLE_PINCODES } from "../config";
import { supabase, isSupabaseConfigured } from "../services/supabase";
import { useAuth } from "./AuthContext";

export type { Address } from "../types";

export interface ServiceabilityResult {
  isServiceable: boolean;
  city: string;
  area: string;
  etaMinutes: number;
  message?: string;
}

export interface LocationContextType {
  currentAddress: Address;
  savedAddresses: Address[];
  isLocationModalOpen: boolean;
  setIsLocationModalOpen: (open: boolean) => void;
  serviceability: ServiceabilityResult;
  selectAddress: (address: Address) => void;
  addAddress: (address: Omit<Address, "id"> | Address) => Promise<void>;
  updateAddress: (id: string, updated: Partial<Address>) => Promise<void>;
  deleteAddress: (id: string) => Promise<void>;
  setDefaultAddress: (id: string) => Promise<void>;
  checkPincodeServiceability: (pincode: string, customCity?: string, customArea?: string) => ServiceabilityResult;
  detectCurrentLocation: () => Promise<Address | null>;
  searchLocations: (query: string) => Array<{ area: string; city: string; pincode: string; lat: number; lng: number }>;
  serviceablePincodes: ServiceablePincode[];
  blockedPincodes: BlockedPincode[];
  addBlockedPincode: (pincode: string, reason?: string) => Promise<void>;
  removeBlockedPincode: (pincode: string) => Promise<void>;
  upsertServiceablePincode: (item: ServiceablePincode) => Promise<void>;
  removeServiceablePincode: (pincode: string) => Promise<void>;
}

const STORAGE_SAVED_ADDRESSES = "supercart_saved_addresses";
const STORAGE_CURRENT_ADDRESS = "supercart_current_address";
const STORAGE_SERVICEABLE_PINCODES = "supercart_serviceable_pincodes";
const STORAGE_BLOCKED_PINCODES = "supercart_blocked_pincodes";

// Empty initial address template (when no address has been confirmed yet)
const EMPTY_INITIAL_ADDRESS: Address = {
  id: "",
  label: "Home",
  receiver_name: "",
  receiver_phone: "",
  house_no: "",
  street: "",
  landmark: "",
  area: "",
  city: "",
  state: "",
  pincode: "",
  lat: 20.5937,
  lng: 78.9629,
  is_default: false,
};

// Seed initial custom pincodes with ETA overrides from config
const INITIAL_SERVICEABLE_PINCODES: ServiceablePincode[] = Object.entries(SERVICEABLE_PINCODES).map(
  ([pin, val]) => ({
    pincode: pin,
    city: val.city,
    state: "India",
    is_active: true,
    eta_minutes: val.etaMinutes || 10,
  })
);

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [savedAddresses, setSavedAddresses] = useState<Address[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SAVED_ADDRESSES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [currentAddress, setCurrentAddress] = useState<Address>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_CURRENT_ADDRESS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.pincode) return parsed;
      }
      return EMPTY_INITIAL_ADDRESS;
    } catch {
      return EMPTY_INITIAL_ADDRESS;
    }
  });

  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Dynamic Serviceable and Blocked Pincodes state
  const [serviceablePincodes, setServiceablePincodes] = useState<ServiceablePincode[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_SERVICEABLE_PINCODES);
      return saved ? JSON.parse(saved) : INITIAL_SERVICEABLE_PINCODES;
    } catch {
      return INITIAL_SERVICEABLE_PINCODES;
    }
  });

  const [blockedPincodes, setBlockedPincodes] = useState<BlockedPincode[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_BLOCKED_PINCODES);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Fetch and subscribe to serviceable_pincodes and blocked_pincodes from Supabase
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    const client = supabase;
    let isMounted = true;

    const fetchPincodes = async () => {
      try {
        const { data: servData, error: servErr } = await client
          .from("serviceable_pincodes")
          .select("*");
        if (!servErr && servData && isMounted && servData.length > 0) {
          setServiceablePincodes(servData as ServiceablePincode[]);
        }

        const { data: blkData, error: blkErr } = await client
          .from("blocked_pincodes")
          .select("*");
        if (!blkErr && blkData && isMounted) {
          setBlockedPincodes(blkData as BlockedPincode[]);
        }
      } catch (err) {
        console.warn("Could not fetch remote pincode tables:", err);
      }
    };

    fetchPincodes();

    // Subscribe to realtime changes
    const servChannel = client
      .channel("serviceable_pincodes_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "serviceable_pincodes" },
        () => fetchPincodes()
      )
      .subscribe();

    const blkChannel = client
      .channel("blocked_pincodes_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "blocked_pincodes" },
        () => fetchPincodes()
      )
      .subscribe();

    return () => {
      isMounted = false;
      client.removeChannel(servChannel);
      client.removeChannel(blkChannel);
    };
  }, []);

  // Save to local storage for persistence across reloads
  useEffect(() => {
    localStorage.setItem(STORAGE_SAVED_ADDRESSES, JSON.stringify(savedAddresses));
  }, [savedAddresses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_CURRENT_ADDRESS, JSON.stringify(currentAddress));
  }, [currentAddress]);

  useEffect(() => {
    localStorage.setItem(STORAGE_SERVICEABLE_PINCODES, JSON.stringify(serviceablePincodes));
  }, [serviceablePincodes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_BLOCKED_PINCODES, JSON.stringify(blockedPincodes));
  }, [blockedPincodes]);

  // Sync addresses from Supabase on user login
  useEffect(() => {
    if (!user || !isSupabaseConfigured || !supabase) return;
    const client = supabase;

    let isMounted = true;
    const fetchSupabaseAddresses = async () => {
      try {
        const { data, error } = await client
          .from("addresses")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false });

        if (!error && data && data.length > 0 && isMounted) {
          setSavedAddresses(data as Address[]);
          const def = data.find((a: any) => a.is_default) || data[0];
          if (def) setCurrentAddress(def as Address);
        }
      } catch (e) {
        console.warn("Addresses fetch failed:", e);
      }
    };

    fetchSupabaseAddresses();
    return () => {
      isMounted = false;
    };
  }, [user?.id]);

  /**
   * Nationwide Serviceability Check:
   * 1. Valid Indian pincode format: 6 digits, first digit 1-8.
   * 2. Must NOT be in blocked_pincodes.
   * 3. If in serviceable_pincodes:
   *    - if is_active is false => not serviceable.
   *    - else => serviceable with custom eta_minutes.
   * 4. ALL other valid Indian pincodes across India are serviceable by default with eta 10 minutes!
   */
  const checkPincodeServiceability = (
    pincode: string,
    customCity?: string,
    customArea?: string
  ): ServiceabilityResult => {
    const cleanPincode = (pincode || "").replace(/\D/g, "").trim();

    // Check valid Indian 6-digit postal code (starts with 1-8)
    const isValidIndianPincode = /^[1-8][0-9]{5}$/.test(cleanPincode);
    if (!isValidIndianPincode) {
      return {
        isServiceable: false,
        city: customCity || "Unknown",
        area: customArea || "Invalid Locality",
        etaMinutes: 0,
        message: "Invalid pincode. Indian pincodes are 6 digits starting with 1-8.",
      };
    }

    // Check if explicitly blocked
    const blocked = blockedPincodes.find((b) => b.pincode === cleanPincode);
    if (blocked) {
      return {
        isServiceable: false,
        city: customCity || "Temporarily Unavailable",
        area: customArea || "Blocked Locality",
        etaMinutes: 0,
        message: blocked.reason || `Deliveries to ${cleanPincode} are temporarily suspended.`,
      };
    }

    // Check custom overrides in serviceable_pincodes
    const custom = serviceablePincodes.find((s) => s.pincode === cleanPincode);
    if (custom) {
      if (custom.is_active === false) {
        return {
          isServiceable: false,
          city: custom.city || customCity || "Paused",
          area: customArea || "Service Paused",
          etaMinutes: 0,
          message: `Delivery service to ${cleanPincode} is currently paused.`,
        };
      }
      return {
        isServiceable: true,
        city: custom.city || customCity || "India",
        area: customArea || custom.city || "Local Hub",
        etaMinutes: custom.eta_minutes || 10,
        message: `Delivery in ${custom.eta_minutes || 10} mins`,
      };
    }

    // Default: Nationwide 10-minute delivery across all Indian states and towns
    return {
      isServiceable: true,
      city: customCity || "India",
      area: customArea || "Dark Store Hub",
      etaMinutes: 10,
      message: "Delivery in 10 mins",
    };
  };

  const serviceability = checkPincodeServiceability(
    currentAddress.pincode,
    currentAddress.city,
    currentAddress.area
  );

  const selectAddress = (addr: Address) => {
    setCurrentAddress(addr);
    setIsLocationModalOpen(false);
  };

  const addAddress = async (addr: Omit<Address, "id"> | Address) => {
    // Deduplication check: within ~0.0002 deg (~20 meters) and same label
    const existingIndex = savedAddresses.findIndex((a) => {
      const latDiff = Math.abs(a.lat - addr.lat);
      const lngDiff = Math.abs(a.lng - addr.lng);
      return latDiff < 0.0002 && lngDiff < 0.0002 && a.label?.toLowerCase() === addr.label?.toLowerCase();
    });

    if (existingIndex !== -1) {
      // Update existing address instead of duplicating
      const existing = savedAddresses[existingIndex];
      const updated: Address = { ...existing, ...addr };
      if (user && isSupabaseConfigured && supabase) {
        try {
          await supabase.from("addresses").update(addr).eq("id", existing.id);
        } catch (e) {
          console.warn("Supabase address dedupe update error:", e);
        }
      }
      setSavedAddresses((prev) => prev.map((a, i) => (i === existingIndex ? updated : a)));
      setCurrentAddress(updated);
      return;
    }

    let assignedId = "addr_" + Math.random().toString(36).substring(2, 9);

    if (user && isSupabaseConfigured && supabase) {
      try {
        const { data, error } = await supabase
          .from("addresses")
          .insert({
            user_id: user.id,
            label: addr.label,
            receiver_name: addr.receiver_name,
            receiver_phone: addr.receiver_phone,
            house_no: addr.house_no,
            street: addr.street,
            landmark: addr.landmark,
            area: addr.area,
            city: addr.city,
            state: addr.state || "India",
            pincode: addr.pincode,
            lat: addr.lat,
            lng: addr.lng,
            is_default: addr.is_default,
          })
          .select("id")
          .single();

        if (!error && data?.id) {
          assignedId = data.id;
        }
      } catch (err) {
        console.warn("Supabase address insert failed:", err);
      }
    }

    const newAddress: Address = {
      ...addr,
      id: assignedId,
    };

    if (newAddress.is_default) {
      setSavedAddresses((prev) =>
        prev.map((a) => ({ ...a, is_default: false })).concat(newAddress)
      );
    } else {
      setSavedAddresses((prev) => [...prev, newAddress]);
    }
    setCurrentAddress(newAddress);
  };

  const updateAddress = async (id: string, updated: Partial<Address>) => {
    if (user && isSupabaseConfigured && supabase) {
      try {
        await supabase.from("addresses").update(updated).eq("id", id);
      } catch (err) {
        console.warn("Supabase address update error:", err);
      }
    }

    setSavedAddresses((prev) =>
      prev.map((addr) => {
        if (addr.id === id) {
          const mod = { ...addr, ...updated };
          if (currentAddress.id === id) {
            setCurrentAddress(mod);
          }
          return mod;
        }
        return addr;
      })
    );
  };

  const deleteAddress = async (id: string) => {
    if (user && isSupabaseConfigured && supabase) {
      try {
        await supabase.from("addresses").delete().eq("id", id);
      } catch (err) {
        console.warn("Supabase address delete error:", err);
      }
    }

    setSavedAddresses((prev) => {
      const filtered = prev.filter((a) => a.id !== id);
      if (currentAddress.id === id && filtered.length > 0) {
        setCurrentAddress(filtered[0]);
      }
      return filtered;
    });
  };

  const setDefaultAddress = async (id: string) => {
    if (user && isSupabaseConfigured && supabase) {
      try {
        await supabase.from("addresses").update({ is_default: false }).eq("user_id", user.id);
        await supabase.from("addresses").update({ is_default: true }).eq("id", id);
      } catch (err) {
        console.warn("Supabase address default update error:", err);
      }
    }

    setSavedAddresses((prev) =>
      prev.map((addr) => ({
        ...addr,
        is_default: addr.id === id,
      }))
    );
    const target = savedAddresses.find((a) => a.id === id);
    if (target) {
      setCurrentAddress({ ...target, is_default: true });
    }
  };

  const detectCurrentLocation = async (): Promise<Address | null> => {
    if (!navigator.geolocation) {
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
            );
            const data = await res.json();
            const addr = data.address || {};
            const pincode = (addr.postcode || "").replace(/\D/g, "").slice(0, 6);
            const area = addr.suburb || addr.neighbourhood || addr.road || addr.village || "";
            const city = addr.city || addr.town || addr.county || addr.state_district || "";
            const state = addr.state || "";

            const newLoc: Address = {
              id: "addr_live_" + Date.now(),
              label: "Home",
              receiver_name: "",
              receiver_phone: "",
              house_no: "",
              street: data.display_name?.split(",").slice(0, 2).join(", ").trim() || "",
              area,
              city,
              state,
              pincode,
              lat: latitude,
              lng: longitude,
              is_default: false,
            };
            setCurrentAddress(newLoc);
            resolve(newLoc);
          } catch {
            const fallback: Address = {
              ...EMPTY_INITIAL_ADDRESS,
              house_no: "",
              street: "",
              area: "",
              city: "",
              lat: latitude,
              lng: longitude,
            };
            setCurrentAddress(fallback);
            resolve(fallback);
          }
        },
        () => {
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    });
  };

  const searchLocations = (query: string) => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    const results: Array<{ area: string; city: string; pincode: string; lat: number; lng: number }> = [];

    // Search through all known custom pincodes and configured areas
    serviceablePincodes.forEach((info) => {
      if (
        info.pincode.includes(q) ||
        (info.city && info.city.toLowerCase().includes(q)) ||
        (info.state && info.state.toLowerCase().includes(q))
      ) {
        results.push({
          pincode: info.pincode,
          area: info.city || "Hub",
          city: info.city || "India",
          lat: 20.5937,
          lng: 78.9629,
        });
      }
    });

    return results;
  };

  // Admin Pincode Management Operations
  const addBlockedPincode = async (pin: string, reason?: string) => {
    const cleanPin = pin.replace(/\D/g, "").trim();
    if (!cleanPin) return;

    const newBlocked: BlockedPincode = {
      pincode: cleanPin,
      reason: reason || "Temporarily blocked by operations",
      blocked_at: new Date().toISOString(),
    };

    setBlockedPincodes((prev) => [
      ...prev.filter((p) => p.pincode !== cleanPin),
      newBlocked,
    ]);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from("blocked_pincodes")
          .upsert({ pincode: cleanPin, reason: newBlocked.reason });
      } catch (err) {
        console.warn("Could not save blocked pincode to Supabase:", err);
      }
    }
  };

  const removeBlockedPincode = async (pin: string) => {
    const cleanPin = pin.replace(/\D/g, "").trim();
    setBlockedPincodes((prev) => prev.filter((p) => p.pincode !== cleanPin));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("blocked_pincodes").delete().eq("pincode", cleanPin);
      } catch (err) {
        console.warn("Could not delete blocked pincode from Supabase:", err);
      }
    }
  };

  const upsertServiceablePincode = async (item: ServiceablePincode) => {
    const cleanPin = item.pincode.replace(/\D/g, "").trim();
    if (!cleanPin) return;

    const updated: ServiceablePincode = {
      ...item,
      pincode: cleanPin,
      updated_at: new Date().toISOString(),
    };

    setServiceablePincodes((prev) => [
      ...prev.filter((p) => p.pincode !== cleanPin),
      updated,
    ]);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("serviceable_pincodes").upsert({
          pincode: cleanPin,
          city: updated.city || "India",
          state: updated.state || "India",
          is_active: updated.is_active,
          eta_minutes: updated.eta_minutes,
        });
      } catch (err) {
        console.warn("Could not upsert serviceable pincode to Supabase:", err);
      }
    }
  };

  const removeServiceablePincode = async (pin: string) => {
    const cleanPin = pin.replace(/\D/g, "").trim();
    setServiceablePincodes((prev) => prev.filter((p) => p.pincode !== cleanPin));

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from("serviceable_pincodes").delete().eq("pincode", cleanPin);
      } catch (err) {
        console.warn("Could not delete serviceable pincode from Supabase:", err);
      }
    }
  };

  return (
    <LocationContext.Provider
      value={{
        currentAddress,
        savedAddresses,
        isLocationModalOpen,
        setIsLocationModalOpen,
        serviceability,
        selectAddress,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        checkPincodeServiceability,
        detectCurrentLocation,
        searchLocations,
        serviceablePincodes,
        blockedPincodes,
        addBlockedPincode,
        removeBlockedPincode,
        upsertServiceablePincode,
        removeServiceablePincode,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
};
