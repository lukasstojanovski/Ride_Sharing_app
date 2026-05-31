import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

function defaultDateYmd(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export type OfferWizardContextValue = {
  to: string;
  setTo: (v: string) => void;
  from: string;
  setFrom: (v: string) => void;
  pickupAddress: string;
  setPickupAddress: (v: string) => void;
  pickupLat: number | null;
  setPickupLat: (v: number | null) => void;
  pickupLng: number | null;
  setPickupLng: (v: number | null) => void;
  dropoffAddress: string;
  setDropoffAddress: (v: string) => void;
  dropoffLat: number | null;
  setDropoffLat: (v: number | null) => void;
  dropoffLng: number | null;
  setDropoffLng: (v: number | null) => void;
  date: string;
  setDate: (v: string) => void;
  time: string;
  setTime: (v: string) => void;
  seats: number;
  setSeats: (v: number) => void;
  vehicleInfo: string;
  setVehicleInfo: (v: string) => void;
  smokingAllowed: boolean;
  setSmokingAllowed: (v: boolean) => void;
  petsAllowed: boolean;
  setPetsAllowed: (v: boolean) => void;
  price: string;
  setPrice: (v: string) => void;
  error: string | null;
  setError: (v: string | null) => void;
  loading: boolean;
  setLoading: (v: boolean) => void;
  success: boolean;
  setSuccess: (v: boolean) => void;
  stackKey: number;
  resetWizard: () => void;
  /** Clears route / schedule / details fields only; does not touch success or loading. */
  clearOfferDraft: () => void;
  remountStack: () => void;
};

const OfferWizardContext = createContext<OfferWizardContextValue | null>(null);

export function OfferWizardProvider({ children }: { children: React.ReactNode }) {
  const [to, setTo] = useState("");
  const [from, setFrom] = useState("");
  const [pickupAddress, setPickupAddress] = useState("");
  const [pickupLat, setPickupLat] = useState<number | null>(null);
  const [pickupLng, setPickupLng] = useState<number | null>(null);
  const [dropoffAddress, setDropoffAddress] = useState("");
  const [dropoffLat, setDropoffLat] = useState<number | null>(null);
  const [dropoffLng, setDropoffLng] = useState<number | null>(null);
  const [date, setDate] = useState(defaultDateYmd);
  const [time, setTime] = useState("");
  const [seats, setSeats] = useState(1);
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [smokingAllowed, setSmokingAllowed] = useState(false);
  const [petsAllowed, setPetsAllowed] = useState(false);
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [stackKey, setStackKey] = useState(0);

  const resetWizard = useCallback(() => {
    setTo("");
    setFrom("");
    setPickupAddress("");
    setPickupLat(null);
    setPickupLng(null);
    setDropoffAddress("");
    setDropoffLat(null);
    setDropoffLng(null);
    setDate(defaultDateYmd());
    setTime("");
    setSeats(1);
    setVehicleInfo("");
    setSmokingAllowed(false);
    setPetsAllowed(false);
    setPrice("");
    setError(null);
    setLoading(false);
    setSuccess(false);
  }, []);

  const remountStack = useCallback(() => {
    setStackKey((k) => k + 1);
  }, []);

  const clearOfferDraft = useCallback(() => {
    setTo("");
    setFrom("");
    setPickupAddress("");
    setPickupLat(null);
    setPickupLng(null);
    setDropoffAddress("");
    setDropoffLat(null);
    setDropoffLng(null);
    setDate(defaultDateYmd());
    setTime("");
    setSeats(1);
    setVehicleInfo("");
    setSmokingAllowed(false);
    setPetsAllowed(false);
    setPrice("");
    setError(null);
  }, []);

  const value = useMemo(
    () => ({
      to,
      setTo,
      from,
      setFrom,
      pickupAddress,
      setPickupAddress,
      pickupLat,
      setPickupLat,
      pickupLng,
      setPickupLng,
      dropoffAddress,
      setDropoffAddress,
      dropoffLat,
      setDropoffLat,
      dropoffLng,
      setDropoffLng,
      date,
      setDate,
      time,
      setTime,
      seats,
      setSeats,
      vehicleInfo,
      setVehicleInfo,
      smokingAllowed,
      setSmokingAllowed,
      petsAllowed,
      setPetsAllowed,
      price,
      setPrice,
      error,
      setError,
      loading,
      setLoading,
      success,
      setSuccess,
      stackKey,
      resetWizard,
      clearOfferDraft,
      remountStack,
    }),
    [
      to,
      from,
      pickupAddress,
      pickupLat,
      pickupLng,
      dropoffAddress,
      dropoffLat,
      dropoffLng,
      date,
      time,
      seats,
      vehicleInfo,
      smokingAllowed,
      petsAllowed,
      price,
      error,
      loading,
      success,
      stackKey,
      resetWizard,
      clearOfferDraft,
      remountStack,
    ]
  );

  return <OfferWizardContext.Provider value={value}>{children}</OfferWizardContext.Provider>;
}

export function useOfferWizard(): OfferWizardContextValue {
  const ctx = useContext(OfferWizardContext);
  if (!ctx) throw new Error("useOfferWizard must be used within OfferWizardProvider");
  return ctx;
}
