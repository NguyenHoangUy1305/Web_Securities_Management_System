<?php

declare(strict_types=1);

namespace App\Http\Controllers\Api\Orders;

use App\Http\Controllers\Api\BaseController;
use App\Http\Resources\OrderResource;
use App\Jobs\ProcessOrderJob;
use App\Models\Order;
use App\Services\OrderService;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class OrderController extends BaseController
{
    protected OrderService $orderService;

    public function __construct(OrderService $orderService)
    {
        $this->orderService = $orderService;
    }

    /**
     * Display a paginated list of orders for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'per_page' => 'nullable|integer|min:1|max:100',
            'status'   => 'nullable|string|in:pending,open,filled,partial,cancelled,rejected',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $perPage = (int) ($request->input('per_page', 15));

            $query = Order::with(['security', 'portfolio'])
                ->where('user_id', $request->user()->id);

            if ($request->has('status')) {
                $query->where('status', $request->input('status'));
            }

            $orders = $query->orderBy('created_at', 'desc')->paginate($perPage);

            return $this->sendResponse(
                $orders->through(fn ($order) => new OrderResource($order)),
                'Orders retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve orders.',
                500
            );
        }
    }

    /**
     * Store a newly created order.
     */
    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'portfolio_id' => 'required|integer|exists:portfolios,id',
            'security_id'  => 'required|integer|exists:securities,id',
            'type'         => 'required|string|in:buy,sell',
            'order_type'   => 'required|string|in:market,limit,stop',
            'quantity'     => 'required|numeric|min:0.0001',
            'price'        => 'nullable|numeric|min:0',
            'expires_at'   => 'nullable|date|after:now',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            $data = array_merge($validator->validated(), [
                'user_id' => $request->user()->id,
            ]);

            $result = $this->orderService->placeOrder($data);

            /** @var Order $order */
            $order = $result['order'];

            // Dispatch the job to attempt matching this order.
            ProcessOrderJob::dispatch($order);

            return $this->sendResponse(
                new OrderResource($order),
                'Order placed successfully.',
                201
            );
        } catch (Exception $e) {
            return $this->sendError(
                $e->getMessage(),
                $e->getCode() ?: 500
            );
        }
    }

    /**
     * Display the specified order.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            /** @var Order|null $order */
            $order = Order::with(['security', 'portfolio', 'user'])
                ->where('user_id', $request->user()->id)
                ->find($id);

            if (!$order) {
                return $this->sendError('Order not found.', 404);
            }

            return $this->sendResponse(
                new OrderResource($order),
                'Order retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve order.',
                500
            );
        }
    }

    /**
     * Cancel an existing order.
     */
    public function cancel(Request $request, int $id): JsonResponse
    {
        try {
            /** @var Order|null $order */
            $order = Order::where('user_id', $request->user()->id)->find($id);

            if (!$order) {
                return $this->sendError('Order not found.', 404);
            }

            $cancelled = $this->orderService->cancelOrder($id);

            return $this->sendResponse(
                new OrderResource($cancelled),
                'Order cancelled successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                $e->getMessage(),
                $e->getCode() ?: 500
            );
        }
    }

    /**
     * Modify an existing order (quantity, price).
     */
    public function modify(Request $request, int $id): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'quantity'   => 'sometimes|required|numeric|min:0.0001',
            'price'      => 'nullable|numeric|min:0',
            'expires_at' => 'nullable|date|after:now',
        ]);

        if ($validator->fails()) {
            return $this->sendError(
                'Validation failed.',
                422,
                $validator->errors()->toArray()
            );
        }

        try {
            /** @var Order|null $order */
            $order = Order::where('user_id', $request->user()->id)->find($id);

            if (!$order) {
                return $this->sendError('Order not found.', 404);
            }

            $modified = $this->orderService->modifyOrder($id, $validator->validated());

            return $this->sendResponse(
                new OrderResource($modified),
                'Order modified successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                $e->getMessage(),
                $e->getCode() ?: 500
            );
        }
    }

    /**
     * Get the order book for a specific security.
     */
    public function orderBook(Request $request, int $securityId): JsonResponse
    {
        try {
            $orderBook = $this->orderService->getOrderBook($securityId);

            return $this->sendResponse(
                $orderBook,
                'Order book retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve order book.',
                500
            );
        }
    }

    /**
     * Get all orders for the authenticated user (convenience method).
     */
    public function myOrders(Request $request): JsonResponse
    {
        try {
            $perPage = (int) ($request->input('per_page', 15));

            $orders = Order::with(['security', 'portfolio'])
                ->where('user_id', $request->user()->id)
                ->orderBy('created_at', 'desc')
                ->paginate($perPage);

            return $this->sendResponse(
                $orders->through(fn ($order) => new OrderResource($order)),
                'My orders retrieved successfully.'
            );
        } catch (Exception $e) {
            return $this->sendError(
                'Failed to retrieve orders.',
                500
            );
        }
    }
}
