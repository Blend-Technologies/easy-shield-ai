import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Upload, Image as ImageIcon, X } from "lucide-react";

interface CreateEventModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    description: string;
    event_date: string;
    end_date: string;
    meeting_link: string;
    meeting_platform: string;
    organizer_name: string;
    max_attendees: number;
    image_url?: string;
  }) => Promise<void>;
  uploadImage: (file: File) => Promise<string | null>;
}

const CreateEventModal = ({ open, onOpenChange, onSubmit, uploadImage }: CreateEventModalProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [eventTime, setEventTime] = useState("08:00");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("10:00");
  const [meetingLink, setMeetingLink] = useState("");
  const [meetingPlatform, setMeetingPlatform] = useState("zoom");
  const [organizerName, setOrganizerName] = useState("");
  const [maxAttendees, setMaxAttendees] = useState(0);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setTitle(""); setDescription(""); setEventDate(""); setEventTime("08:00");
    setEndDate(""); setEndTime("10:00"); setMeetingLink("");
    setMeetingPlatform("zoom"); setOrganizerName(""); setMaxAttendees(0); setImageUrl(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const url = await uploadImage(file);
    if (url) setImageUrl(url);
    setUploading(false);
  };

  const handleSubmit = async () => {
    if (!title || !eventDate || !endDate || !organizerName) return;
    setSubmitting(true);
    await onSubmit({
      title,
      description,
      event_date: new Date(`${eventDate}T${eventTime}`).toISOString(),
      end_date: new Date(`${endDate}T${endTime}`).toISOString(),
      meeting_link: meetingLink,
      meeting_platform: meetingPlatform,
      organizer_name: organizerName,
      max_attendees: maxAttendees,
      image_url: imageUrl || undefined,
    });
    setSubmitting(false);
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Event</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Image upload */}
          <div>
            <Label className="text-sm font-medium">Event Image</Label>
            <input type="file" ref={fileRef} accept="image/*" className="hidden" onChange={handleImageUpload} />
            {imageUrl ? (
              <div className="relative mt-2 rounded-lg overflow-hidden h-40">
                <img src={imageUrl} alt="Event" className="w-full h-full object-cover" />
                <button
                  onClick={() => setImageUrl(null)}
                  className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="mt-2 w-full h-32 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary/50 transition-colors"
              >
                {uploading ? (
                  <span className="text-sm">Uploading…</span>
                ) : (
                  <>
                    <ImageIcon className="w-6 h-6" />
                    <span className="text-sm">Click to upload image</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Title */}
          <div>
            <Label htmlFor="event-title">Title *</Label>
            <Input id="event-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Weekly Q&A Call" />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="event-desc">Description</Label>
            <Textarea id="event-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What's this event about?" rows={3} />
          </div>

          {/* Date/Time row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Start Date *</Label>
              <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} />
            </div>
            <div>
              <Label>Start Time</Label>
              <Input type="time" value={eventTime} onChange={(e) => setEventTime(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>End Date *</Label>
              <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
            <div>
              <Label>End Time</Label>
              <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          {/* Meeting platform & link */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Platform</Label>
              <Select value={meetingPlatform} onValueChange={setMeetingPlatform}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="zoom">Zoom</SelectItem>
                  <SelectItem value="google_meet">Google Meet</SelectItem>
                  <SelectItem value="teams">Microsoft Teams</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Meeting Link</Label>
              <Input value={meetingLink} onChange={(e) => setMeetingLink(e.target.value)} placeholder="https://zoom.us/j/..." />
            </div>
          </div>

          {/* Organizer */}
          <div>
            <Label htmlFor="organizer">Organizer Name *</Label>
            <Input id="organizer" value={organizerName} onChange={(e) => setOrganizerName(e.target.value)} placeholder="Dave Ebbelaar" />
          </div>

          {/* Max attendees */}
          <div>
            <Label>Max Attendees (0 = unlimited)</Label>
            <Input type="number" min={0} value={maxAttendees} onChange={(e) => setMaxAttendees(Number(e.target.value))} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={submitting || !title || !eventDate || !endDate || !organizerName}>
            {submitting ? "Creating…" : "Create Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CreateEventModal;
