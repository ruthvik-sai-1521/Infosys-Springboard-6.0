package com.neurofleetx.controller;

import com.neurofleetx.model.Message;
import com.neurofleetx.model.User;
import com.neurofleetx.repository.MessageRepository;
import com.neurofleetx.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "*")
public class MessageController {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private UserRepository userRepository;

    @GetMapping("/{userId}")
    public List<Message> getMessagesForUser(@PathVariable Long userId) {
        return messageRepository.findByReceiverId(userId);
    }

    @PostMapping("/send")
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, Object> payload) {
        try {
            Long senderId = ((Number) payload.get("senderId")).longValue();
            Long receiverId = ((Number) payload.get("receiverId")).longValue();
            String content = (String) payload.get("content");

            User sender = userRepository.findById(senderId).orElseThrow(() -> new RuntimeException("Sender not found"));
            User receiver = userRepository.findById(receiverId)
                    .orElseThrow(() -> new RuntimeException("Receiver not found"));

            Message msg = new Message();
            msg.setSender(sender);
            msg.setReceiver(receiver);
            msg.setContent(content);
            msg.setSentAt(LocalDateTime.now());

            messageRepository.save(msg);
            return ResponseEntity.ok(Map.of("message", "Message sent successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
