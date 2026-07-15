import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from "react";

import { useNavigate, useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/button";

import { ZoomSdkStartingSpinner } from "@/components/live/ZoomSdkStartingSpinner";

import {
  getInstructorLiveClassPreviewSdkAuth,
  getInstructorLiveClassSdkAuth,
  getLearnerLiveClassSdkAuth,
  getWebinarHostSdkAuth,
  getZoomEmbedAuth,
  type ZoomMeetingBranding,
  type ZoomMeetingSdkAuth,
} from "@/api/axios";

import { LiveMeetingExperience } from "@/components/live/LiveMeetingExperience";
import type { DailyMeetingSdkAuth } from "@/components/live/DailyMeetingRoom";

import { ParticipantWaitingStage, type ParticipantBranding } from "@/components/live/ParticipantWaitingStage";

import type { HostBranding } from "@/components/live/HostWaitingStage";

import { HUB } from "@/lib/hubConfig";

import { buildZoomMeetingBranding } from "@/lib/zoomMeetingBranding";
import type { ZoomClientBranding } from "@/lib/zoomClientBranding";
import {
  institutionBrandingName,
  institutionLogoUrl,
  isStoredMainAdmin,
  prepareMainAdminZoomSession,
  refreshInstitutionBrandingFromApi,
} from "@/lib/institutionContext";
import { clearZoomLaunchPending } from "@/lib/zoomLaunchPending";
import { resolveZoomSdkJoinUserName } from "@/lib/zoomJoinDisplayName";
import { getAppDisplayName } from "@/lib/brandSanitize";
import { loadZoomClientSdk } from "@/lib/zoomClientLoader";

import { resolveLearnerEmail, resolveLearnerStudentId } from "@/lib/dashboardUser";

import { startHostRecordingAfterJoin } from "@/lib/hostRecordingAfterJoin";

import { useToast } from "@/components/ui/use-toast";

import "@/components/live/zoomClientMeeting.css";



type LiveClassMaterialMeta = {

  id: number;

  title?: string | null;

  course_title?: string | null;

  recording_enabled?: boolean;

};



type LiveClassSdkAuthResponse = {

  provider?: "zoom" | "daily";

  sdk: ZoomMeetingSdkAuth | DailyMeetingSdkAuth;

  material?: LiveClassMaterialMeta;

  preview?: boolean;

} & ZoomMeetingBranding;



const ZoomEmbedMeetingRoom = () => {

  const { toast } = useToast();

  const [searchParams] = useSearchParams();

  const navigate = useNavigate();



  const materialId = searchParams.get("material_id") ? Number(searchParams.get("material_id")) : undefined;

  const meetingNumber = searchParams.get("meeting_number") || undefined;

  const role = Number(searchParams.get("role") || "0") === 1 ? 1 : 0;

  const studentId = searchParams.get("student_id") ? Number(searchParams.get("student_id")) : undefined;

  const password = searchParams.get("password") || undefined;

  const webinarHost = searchParams.get("webinar_host") === "1";

  const preview = searchParams.get("preview") === "1";

  const userName = searchParams.get("user_name") || undefined;

  const userEmail = searchParams.get("user_email") || undefined;

  const useComponentView =

    searchParams.get("view") === "component" || searchParams.get("view") === "embed";



  const instructorEmail = useMemo(

    () => (typeof window !== "undefined" ? localStorage.getItem("parrot_user_email") ?? "" : ""),

    [],

  );

  const learnerEmail = useMemo(() => resolveLearnerEmail(), []);

  const storedStudentId = useMemo(() => resolveLearnerStudentId() || undefined, []);

  const storedUserName = useMemo(

    () => localStorage.getItem("parrot_user_name")?.trim() || undefined,

    [],

  );



  const isHost = (role === 1 && !preview) || webinarHost;



  const [loading, setLoading] = useState(true);

  const [sdk, setSdk] = useState<ZoomMeetingSdkAuth | DailyMeetingSdkAuth | null>(null);
  const [meetingProvider, setMeetingProvider] = useState<"zoom" | "daily">("daily");

  const [materialMeta, setMaterialMeta] = useState<LiveClassMaterialMeta | null>(null);

  const [hostBranding, setHostBranding] = useState<HostBranding | null>(null);

  const [participantBranding, setParticipantBranding] = useState<ParticipantBranding | null>(null);

  const [clientBranding, setClientBranding] = useState<ZoomClientBranding | null>(null);

  const [prejoinAvatarUrl, setPrejoinAvatarUrl] = useState<string | null>(null);

  const [error, setError] = useState<string | null>(null);

  const [waitingForHost, setWaitingForHost] = useState(false);

  const [recordingRequested, setRecordingRequested] = useState(false);



  const meetingTitle =

    materialMeta?.title ||

    (webinarHost ? "Meeting Registration" : isHost ? "Host live class" : "Live class");

  const backPath = webinarHost

    ? "/dashboard/meeting-registrations"

    : isHost

      ? "/dashboard/classes"

      : "/dashboard/learner/live-classes";



  const applyMeetingBranding = (

    auth: ZoomMeetingBranding | null | undefined,

    opts: { sessionTitle?: string | null; courseTitle?: string | null; fallbackName: string },

  ) => {

    const built = buildZoomMeetingBranding(auth, {

      isHost,

      fallbackName: opts.fallbackName,

      sessionTitle: opts.sessionTitle,

      courseTitle: opts.courseTitle,

    });

    setPrejoinAvatarUrl(built.avatarUrl);

    setHostBranding(built.hostBranding ?? null);

    setParticipantBranding(built.participantBranding ?? null);

    setClientBranding(built.clientBranding);

  };



  const applyAuthResponse = (auth: LiveClassSdkAuthResponse) => {
    const rawDaily = (auth.sdk ?? {}) as DailyMeetingSdkAuth;
    const looksDaily =
      auth.provider === "daily" ||
      (Boolean(String(rawDaily.join_url || rawDaily.room_url || "").trim()) &&
        Boolean(String(rawDaily.token || "").trim()));
    const provider = looksDaily ? "daily" : "zoom";
    setMeetingProvider(provider);

    if (provider === "daily") {
      const joinUrl = String(rawDaily.join_url || rawDaily.room_url || "").trim();
      const token = String(rawDaily.token || "").trim();
      if (!joinUrl || !token) {
        setError("Daily room was not prepared correctly. Refresh and try again.");
        setSdk(null);
        setLoading(false);
        return;
      }
      // Prefer explicit URL name (registrant personal link). Do not reuse the
      // logged-in admin's localStorage name for participant joins.
      const dailyFallback =
        String(userName || "").trim() ||
        String(rawDaily.user_name || "").trim() ||
        (isHost ? String(storedUserName || "").trim() || "Instructor" : "Guest");
      const dailyDisplayName = isHost
        ? resolveZoomSdkJoinUserName(auth, { isHost: true, fallbackName: dailyFallback })
        : dailyFallback;
      setSdk({
        join_url: joinUrl,
        token,
        room_name: rawDaily.room_name || undefined,
        user_name: dailyDisplayName,
        role: isHost ? 1 : 0,
      });
      if (auth.material) setMaterialMeta(auth.material);
      else if (webinarHost) setMaterialMeta(null);
      applyMeetingBranding(auth, {
        sessionTitle: webinarHost ? "Meeting Registration" : auth.material?.title,
        courseTitle: auth.material?.course_title,
        fallbackName: dailyDisplayName,
      });
      return;
    }

    const zoomSdk = auth.sdk as ZoomMeetingSdkAuth;
    const fallbackName =
      String(userName || "").trim() ||
      zoomSdk.user_name ||
      (isHost ? storedUserName || "Instructor" : "Guest");
    const nextSdk = {
      ...zoomSdk,
      user_name: resolveZoomSdkJoinUserName(auth, { isHost, fallbackName }),
    };

    setSdk(nextSdk);

    if (auth.material) setMaterialMeta(auth.material);
    else if (webinarHost) setMaterialMeta(null);

    applyMeetingBranding(auth, {
      sessionTitle: webinarHost ? "Meeting Registration" : auth.material?.title,
      courseTitle: auth.material?.course_title,
      fallbackName: nextSdk.user_name || (isHost ? storedUserName || "Instructor" : "Guest"),
    });
  };



  const loadSdk = useCallback(async () => {

    setLoading(true);

    setError(null);

    setWaitingForHost(false);



    try {

      void loadZoomClientSdk().catch(() => undefined);
      prepareMainAdminZoomSession();
      if (!isStoredMainAdmin()) {
        await refreshInstitutionBrandingFromApi(instructorEmail || learnerEmail || undefined).catch(() => undefined);
      }

      if (webinarHost) {
        // Host joins as institution / main admin — never as a registrant.
        const auth = await getWebinarHostSdkAuth(userName || storedUserName || undefined);
        applyAuthResponse(auth as LiveClassSdkAuthResponse);
        return;
      }

      if (materialId) {

        if (preview && instructorEmail) {

          const auth = await getInstructorLiveClassPreviewSdkAuth(materialId, instructorEmail);

          applyAuthResponse(auth);

          return;

        }



        if (role === 1) {

          if (!instructorEmail) {

            setError("Sign in as an instructor to host this class.");

            setSdk(null);

            return;

          }

          const auth = await getInstructorLiveClassSdkAuth(materialId, instructorEmail);

          applyAuthResponse(auth);

          return;

        }



        const effectiveStudentId = resolveLearnerStudentId(studentId);

        if (!effectiveStudentId && !learnerEmail) {

          setError("Sign in as a learner to join this class.");

          setSdk(null);

          return;

        }



        try {

          const auth = await getLearnerLiveClassSdkAuth(

            materialId,

            effectiveStudentId,

            learnerEmail || undefined,

          );

          applyAuthResponse(auth);

        } catch (err: unknown) {

          const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;

          if (/not live yet|wait for the instructor/i.test(message || "")) {

            setWaitingForHost(true);

            setSdk(null);

            setMaterialMeta((prev) => prev ?? { id: materialId, title: "Live class" });

            return;

          }

          throw err;

        }

        return;

      }



      if (meetingNumber) {
        const auth = await getZoomEmbedAuth({
          meeting_number: meetingNumber,
          role,
          password,
          // Participant personal links carry user_name; do not substitute the
          // logged-in admin's name when opening a registrant join URL.
          user_name: userName || (role === 1 ? storedUserName || "Host" : "Guest"),
          user_email: userEmail,
        });
        applyAuthResponse(auth as LiveClassSdkAuthResponse);
        return;
      }



      setError("Invalid meeting link.");

      setSdk(null);

    } catch (err: unknown) {

      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;

      setError(message || "Unable to start in-app meeting.");

      setSdk(null);

    } finally {

      setLoading(false);

    }

  }, [

    webinarHost,

    materialId,

    preview,

    role,

    instructorEmail,

    studentId,

    storedStudentId,

    learnerEmail,

    meetingNumber,

    password,

    userName,

    userEmail,

  ]);



  useEffect(() => {

    void loadSdk();

  }, [loadSdk]);



  useLayoutEffect(() => {
    clearZoomLaunchPending();
    return () => clearZoomLaunchPending();
  }, []);



  useEffect(() => {

    if (!waitingForHost) return;

    const timer = window.setInterval(() => void loadSdk(), 5000);

    return () => window.clearInterval(timer);

  }, [waitingForHost, loadSdk]);



  const handleHostJoined = useCallback(() => {

    if (!isHost || preview || !materialId || !instructorEmail) return;

    if (recordingRequested) return;



    const wantsRecording =

      materialMeta?.recording_enabled === true ||

      searchParams.get("record") === "1";



    if (!wantsRecording) return;



    setRecordingRequested(true);

    void startHostRecordingAfterJoin(materialId, instructorEmail).then((ok) => {

      if (ok) {

        toast({

          title: "Cloud recording started",

          description: "Recording is active for this live class.",

        });

      } else {

        toast({

          variant: "destructive",

          title: "Recording not started yet",

          description: "Use the Record control in the Zoom toolbar if needed.",

        });

      }

    });

  }, [

    instructorEmail,

    isHost,

    materialId,

    materialMeta?.recording_enabled,

    preview,

    recordingRequested,

    searchParams,

    toast,

  ]);



  return (

    <div
      className={`zoom-client-meeting-page${
        meetingProvider === "daily" ? " zoom-client-meeting-page--interactive" : ""
      }`}
    >

      {loading && !waitingForHost && !sdk ? (

        <ZoomSdkStartingSpinner
          active
          phase="preparing"
          isHost={isHost}
          meetingTitle={meetingTitle}
          institutionName={
            isStoredMainAdmin()
              ? getAppDisplayName()
              : (clientBranding?.companyName ??
                hostBranding?.companyName ??
                participantBranding?.companyName ??
                institutionBrandingName() ??
                HUB.company)
          }
          logoUrl={
            clientBranding?.logoUrl ??
            hostBranding?.avatarUrl ??
            participantBranding?.hostAvatarUrl ??
            institutionLogoUrl()
          }
          fullscreen
        />

      ) : waitingForHost && materialId ? (

        <div className="zoom-client-meeting-loading">

          <ParticipantWaitingStage

            branding={

              participantBranding ?? {

                name: storedUserName || "Learner",

                companyName: materialMeta?.course_title || HUB.name,

                cohortTitle: materialMeta?.title || undefined,

              }

            }

            mode="host_waiting"

          />

        </div>

      ) : error && !sdk ? (

        <div className="zoom-client-meeting-loading px-6">

          <div className="w-full max-w-md space-y-4 rounded-xl border border-red-900/50 bg-[#232323] p-8 text-center">

            <p className="text-red-300">{error}</p>

            <div className="flex flex-wrap justify-center gap-2">

              <Button className="bg-[#0e72ed] hover:bg-[#0b5fc7]" onClick={() => void loadSdk()}>

                Try again

              </Button>

              <Button variant="ghost" className="text-zinc-300 hover:bg-white/10" onClick={() => navigate(backPath)}>

                Go back

              </Button>

            </div>

          </div>

        </div>

      ) : sdk ? (

        <LiveMeetingExperience
          key={`${meetingProvider}-${"meeting_number" in sdk ? sdk.meeting_number : sdk.room_name}-${preview ? "preview" : role}-${useComponentView ? "component" : "client"}`}
          provider={meetingProvider}
          sdk={sdk}
          sdkView={useComponentView ? "component" : "client"}
          meetingTitle={meetingTitle}
          userName={
            "user_name" in sdk && sdk.user_name
              ? sdk.user_name
              : storedUserName || (isHost ? "Instructor" : "Learner")
          }
          avatarUrl={prejoinAvatarUrl}
          isHost={isHost}
          shareUrl={
            typeof window !== "undefined"
              ? webinarHost
                ? `${window.location.origin}/meeting-registration`
                : meetingNumber
                ? `${window.location.origin}/meeting/room?meeting_number=${encodeURIComponent(
                    String(
                      ("room_name" in sdk && sdk.room_name) ||
                        meetingNumber ||
                        "",
                    ),
                  )}&role=0`
                : materialId
                  ? `${window.location.origin}/meeting/room?material_id=${materialId}&role=0`
                  : undefined
              : undefined
          }
          hostBranding={hostBranding ?? undefined}
          participantBranding={participantBranding ?? undefined}
          clientBranding={clientBranding}
          onJoined={handleHostJoined}
          onLeft={() => navigate(backPath)}
          onPrejoinCancel={() => navigate(backPath)}
          skipPrejoin={meetingProvider !== "daily"}
          materialId={materialId}
          hostEmail={instructorEmail}
          leaveDashboardLabel={webinarHost ? "Back to registrations" : "Back to dashboard"}
        />

      ) : null}

    </div>

  );

};



export default ZoomEmbedMeetingRoom;


