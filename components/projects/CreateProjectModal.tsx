"use client";

import { useState } from "react";

import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import DatePicker from "@/components/ui/DatePicker";
import Textarea from "@/components/ui/Textarea";
import { useRouter } from "next/navigation";

type CreateProjectModalProps = {
  open: boolean;
  onClose: () => void;
};

export default function CreateProjectModal({
  open,
  onClose,
}: CreateProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function handleCreateProject() {
  if (!name.trim()) {
    alert("Project name is required.");
    return;
  }

  setLoading(true);

  try {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        description,
        priority,
        deadline: deadline || null,
      }),
    });

    if (!res.ok) {
      throw new Error("Failed to create project.");
    }
    setName("");
    setDescription("");
    setPriority("medium");
    setDeadline("");
    onClose();
    router.refresh();
  } catch (err) {
    alert("Unable to create project.");
    console.error(err);
  } finally {
    setLoading(false);
  }
}

  return (
    <Modal
      isOpen={open}
      onClose={onClose}
      title="Create New Project"
      footer={
        <>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>

          <Button
            loading={loading}
            onClick={handleCreateProject}
        >
            Create Project
          </Button>
        </>
      }
    >
      <p className="mb-6 text-slate-500">
        Start a new workspace for your team.
      </p>

      <div className="space-y-5">
        <Input
          label="Project Name"
          placeholder="Mobile App Launch"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <Textarea
          label="Description"
          placeholder="Describe your project..."
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={[
              { label: "Low", value: "low" },
              { label: "Medium", value: "medium" },
              { label: "High", value: "high" },
            ]}
          />

          <DatePicker
            label="Deadline"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
      </div>
    </Modal>
  );
}