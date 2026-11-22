# Diagrama de classes — PrintHub Regional

Diagrama derivado do arquivo `backend/prisma/schema.prisma`. Os atributos opcionais são indicados com `?`. As cardinalidades representam as relações no esquema; validações adicionais podem ser aplicadas pelos serviços.

```mermaid
classDiagram
  direction TB
  class User {
    +Int id
    +String name
    +String email
    +String passwordHash
    +String? phone
    +Role role
    +Boolean active
    +DateTime createdAt
  }
  class Product {
    +Int id
    +Int producerId
    +String name
    +String description
    +String category
    +String material
    +String? color
    +Int priceCents
    +Int availableQuantity
    +Int productionDays
    +String imageUrl
    +Boolean active
    +DateTime createdAt
    +DateTime updatedAt
  }
  class PickupPoint {
    +Int id
    +String name
    +String address
    +String district
    +String city
    +Int? responsibleUserId
    +Int deliveryCostCents
    +Boolean active
    +DateTime createdAt
  }
  class Order {
    +Int id
    +Int consumerId
    +Int producerId
    +Int pickupPointId
    +Int? batchId
    +OrderStatus status
    +Int productsTotalCents
    +Int? deliveryShareCents
    +Int? batchPosition
    +String? rejectionReason
    +String? cancelReason
    +DateTime acceptDeadline
    +DateTime? acceptedAt
    +DateTime createdAt
    +DateTime updatedAt
  }
  class OrderItem {
    +Int id
    +Int orderId
    +Int productId
    +Int quantity
    +Int unitPriceCents
  }
  class Batch {
    +Int id
    +Int pickupPointId
    +Int deliveryCostCents
    +DateTime startDate
    +DateTime deadline
    +BatchStatus status
    +DateTime? closedAt
  }
  class Review {
    +Int id
    +Int consumerId
    +Int productId
    +Int orderId
    +Int rating
    +String? comment
    +DateTime createdAt
  }
  class OrderStatusHistory {
    +Int id
    +Int orderId
    +OrderStatus? fromStatus
    +OrderStatus toStatus
    +Int? changedById
    +DateTime createdAt
  }
  class AuditLog {
    +Int id
    +Int? userId
    +String action
    +String entity
    +Int? entityId
    +Json? data
    +DateTime createdAt
  }
  class PasswordResetToken {
    +Int id
    +Int userId
    +String tokenHash
    +DateTime expiresAt
    +DateTime? usedAt
    +DateTime createdAt
  }

  User "1" --> "0..*" Product : produces
  User "1" --> "0..*" Order : consumer
  User "1" --> "0..*" Order : producer
  User "0..1" -- "0..1" PickupPoint : responsible
  User "1" --> "0..*" Review : writes
  User "0..1" --> "0..*" OrderStatusHistory : changes
  User "0..1" --> "0..*" AuditLog : performs
  User "1" --> "0..*" PasswordResetToken : owns
  PickupPoint "1" --> "0..*" Order : receives
  PickupPoint "1" --> "0..*" Batch : groups
  Batch "0..1" <-- "0..*" Order : joins
  Order "1" --> "0..*" OrderItem : contains
  Product "1" --> "0..*" OrderItem : orderedAs
  Order "1" --> "0..*" OrderStatusHistory : tracks
  Order "1" --> "0..*" Review : evaluatedBy
  Product "1" --> "0..*" Review : receives
```

## Observações sobre o modelo

- `PickupPoint.responsibleUserId` é opcional e possui `@unique`: um usuário pode ser responsável por no máximo um ponto de retirada.
- `Order.batchId` é opcional: um pedido pode estar sem lote ou associado a um único lote; um lote pode reunir vários pedidos.
- `OrderStatusHistory.changedById` e `AuditLog.userId` são opcionais, permitindo registrar eventos automáticos ou sem usuário associado.
- `OrderItem` tem restrição `@@unique([orderId, productId])`; `Review` tem `@@unique([orderId, productId])`.
- `OrderItem` e `OrderStatusHistory` usam `onDelete: Cascade` em suas relações com `Order`; isso descreve a regra do banco, não a existência de uma operação comum de exclusão de pedidos na interface.
- O esquema não impõe por cardinalidade um mínimo de um item por pedido; esse requisito deve ser garantido pela lógica de negócio.
