package com.neurofleetx.repository;

import com.neurofleetx.model.Message;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    List<Message> findByReceiverId(Long receiverId);

    List<Message> findBySenderIdAndReceiverId(Long senderId, Long receiverId);
}
