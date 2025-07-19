package com.synaptik.model;

import io.quarkus.mongodb.panache.PanacheMongoEntity;
import io.quarkus.mongodb.panache.common.MongoEntity;
import org.bson.types.ObjectId;

import java.time.LocalDateTime;
import java.util.Set;

@MongoEntity(collection = "users")
public class User extends PanacheMongoEntity {
    
    public ObjectId id;
    public String username;
    public String email;
    public String passwordHash; // Store hashed password, never plain text
    public Set<String> roles;
    public boolean enabled = true;
    public LocalDateTime createdAt;
    public LocalDateTime lastLogin;
    
    // Panache finder methods
    public static User findByUsername(String username) {
        return find("username", username).firstResult();
    }
    
    public static User findByEmail(String email) {
        return find("email", email).firstResult();
    }
}

// Password utility class
package com.synaptik.util;

import io.quarkus.elytron.security.common.BcryptUtil;

public class PasswordUtil {
    
    public static String hashPassword(String plainPassword) {
        return BcryptUtil.bcryptHash(plainPassword);
    }
    
    public static boolean verifyPassword(String plainPassword, String hashedPassword) {
        return BcryptUtil.matches(plainPassword, hashedPassword);
    }
}
